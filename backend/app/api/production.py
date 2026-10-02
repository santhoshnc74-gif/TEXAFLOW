from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.core.database import get_db
from app.models.production import Production, ProductionStage, ProductionUpdate, ProductionWorker, ProductionMachine
from app.models.order import Order
from app.models.worker import Worker
from app.models.machine import Machine
from app.models.customer import Customer
from app.schemas.production import ProductionCreate, ProductionUpdate as ProdUpdateSchema, ProductionResponse, ProductionUpdateCreate, ProductionUpdateResponse

router = APIRouter()

def format_production(p: Production, db: Session):
    data = {c.name: getattr(p, c.name) for c in p.__table__.columns}
    
    order = db.query(Order).filter(Order.id == p.order_id).first()
    if order:
        data["order_number"] = order.order_number
        data["product_name"] = order.product_name
        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        data["customer_name"] = customer.customer_name if customer else None
        
    if p.supervisor_id:
        worker = db.query(Worker).filter(Worker.id == p.supervisor_id).first()
        data["supervisor_name"] = worker.name if worker else None
        
    stages = db.query(ProductionStage).filter(ProductionStage.production_id == p.id).order_by(ProductionStage.sequence_number).all()
    data["stages"] = [
        {c.name: getattr(s, c.name) for c in s.__table__.columns}
        for s in stages
    ]
    return data

@router.post("/", response_model=ProductionResponse)
def create_production(data: ProductionCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    try:
        new_prod = Production(
            production_code=data.production_code,
            order_id=data.order_id,
            department=data.department,
            planned_start_date=data.planned_start_date,
            planned_end_date=data.planned_end_date,
            target_quantity=data.target_quantity,
            priority=data.priority,
            supervisor_id=data.supervisor_id,
            notes=data.notes,
            remaining_quantity=data.target_quantity
        )
        db.add(new_prod)
        db.commit()
        db.refresh(new_prod)
        
        if data.stages:
            for stage in data.stages:
                new_stage = ProductionStage(
                    production_id=new_prod.id,
                    **stage.model_dump()
                )
                db.add(new_stage)
            db.commit()
            
        return format_production(new_prod, db)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Production code already exists or invalid foreign key")

@router.get("/", response_model=List[ProductionResponse])
def get_productions(
    search: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Production)
    if search:
        search_term = f"%{search}%"
        query = query.join(Order).join(Customer).filter(
            (Production.production_code.ilike(search_term)) |
            (Order.order_number.ilike(search_term)) |
            (Customer.customer_name.ilike(search_term)) |
            (Order.product_name.ilike(search_term))
        )
    if status:
        query = query.filter(Production.status == status)
    if department:
        query = query.filter(Production.department == department)
        
    query = query.order_by(Production.id.desc())
    results = query.all()
    return [format_production(p, db) for p in results]

@router.get("/{id}", response_model=ProductionResponse)
def get_production(id: int, db: Session = Depends(get_db)):
    p = db.query(Production).filter(Production.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Production not found")
    return format_production(p, db)

@router.delete("/{id}")
def delete_production(id: int, db: Session = Depends(get_db)):
    p = db.query(Production).filter(Production.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Production not found")
    db.delete(p)
    db.commit()
    return {"message": "Production deleted"}

@router.post("/{id}/updates", response_model=ProductionUpdateResponse)
def add_production_update(id: int, data: ProductionUpdateCreate, db: Session = Depends(get_db)):
    prod = db.query(Production).filter(Production.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Production plan not found")
        
    new_update = ProductionUpdate(production_id=id, **data.model_dump())
    db.add(new_update)
    
    # Update Production Stage
    if data.stage_id:
        stage = db.query(ProductionStage).filter(ProductionStage.id == data.stage_id).first()
        if stage:
            stage.completed_quantity += data.quantity_produced
            stage.rejected_quantity += data.rejected_quantity
            if stage.status == "Not Started":
                stage.status = "In Progress"
                if not stage.actual_start_date:
                    stage.actual_start_date = data.production_date
            if stage.completed_quantity >= stage.target_quantity:
                stage.status = "Completed"
                stage.actual_end_date = data.production_date
                
    # Update Production Plan
    prod.completed_quantity += data.quantity_produced
    prod.rejected_quantity += data.rejected_quantity
    prod.remaining_quantity = max(0, prod.target_quantity - prod.completed_quantity)
    prod.progress_percentage = round((prod.completed_quantity / prod.target_quantity) * 100, 2) if prod.target_quantity > 0 else 0
    
    if prod.status in ["Planned", "Ready"]:
        prod.status = "In Progress"
        prod.actual_start_date = data.production_date
        
    if prod.completed_quantity >= prod.target_quantity:
        prod.status = "Completed"
        prod.actual_end_date = data.production_date
        
    # Update Order
    order = db.query(Order).filter(Order.id == prod.order_id).first()
    if order:
        order.completed_quantity += data.quantity_produced
        if order.status == "Pending":
            order.status = "In Production"
            
    db.commit()
    db.refresh(new_update)
    
    # Format response
    resp = {c.name: getattr(new_update, c.name) for c in new_update.__table__.columns}
    if new_update.stage_id:
        s = db.query(ProductionStage).filter(ProductionStage.id == new_update.stage_id).first()
        resp["stage_name"] = s.stage_name if s else None
    if new_update.worker_id:
        w = db.query(Worker).filter(Worker.id == new_update.worker_id).first()
        resp["worker_name"] = w.name if w else None
    if new_update.machine_id:
        m = db.query(Machine).filter(Machine.id == new_update.machine_id).first()
        resp["machine_name"] = m.machine_name if m else None
        
    return resp

@router.get("/{id}/updates", response_model=List[ProductionUpdateResponse])
def get_production_updates(id: int, db: Session = Depends(get_db)):
    updates = db.query(ProductionUpdate).filter(ProductionUpdate.production_id == id).order_by(ProductionUpdate.created_at.desc()).all()
    results = []
    for u in updates:
        resp = {c.name: getattr(u, c.name) for c in u.__table__.columns}
        if u.stage_id:
            s = db.query(ProductionStage).filter(ProductionStage.id == u.stage_id).first()
            resp["stage_name"] = s.stage_name if s else None
        if u.worker_id:
            w = db.query(Worker).filter(Worker.id == u.worker_id).first()
            resp["worker_name"] = w.name if w else None
        if u.machine_id:
            m = db.query(Machine).filter(Machine.id == u.machine_id).first()
            resp["machine_name"] = m.machine_name if m else None
        results.append(resp)
    return results
