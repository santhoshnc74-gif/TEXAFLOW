from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import List, Optional
from app.core.database import get_db
from app.models.machine import Machine, MachineStatusHistory
from app.models.worker import Worker
from app.schemas.machine import MachineCreate, MachineUpdate, MachineResponse, MachineStatusUpdate, MachineStatusHistoryResponse

router = APIRouter()

def format_machine(machine: Machine, worker: Optional[Worker]):
    data = {c.name: getattr(machine, c.name) for c in machine.__table__.columns}
    data["operator_name"] = worker.name if worker else None
    return data

@router.post("/", response_model=MachineResponse)
def create_machine(data: MachineCreate, db: Session = Depends(get_db)):
    if data.current_operator_id:
        worker = db.query(Worker).filter(Worker.id == data.current_operator_id).first()
        if not worker:
            raise HTTPException(status_code=404, detail="Operator (Worker) not found")

    try:
        new_machine = Machine(**data.model_dump())
        db.add(new_machine)
        db.commit()
        db.refresh(new_machine)
        
        # Determine operator for response
        worker = None
        if new_machine.current_operator_id:
            worker = db.query(Worker).filter(Worker.id == new_machine.current_operator_id).first()
            
        return format_machine(new_machine, worker)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Machine code already exists")

@router.get("/", response_model=List[MachineResponse])
def get_machines(
    search: Optional[str] = None,
    machine_type: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    condition: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Machine, Worker).outerjoin(Worker, Machine.current_operator_id == Worker.id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Machine.machine_code.ilike(search_term)) |
            (Machine.machine_name.ilike(search_term)) |
            (Machine.brand.ilike(search_term)) |
            (Machine.model.ilike(search_term))
        )
    if machine_type:
        query = query.filter(Machine.machine_type == machine_type)
    if department:
        query = query.filter(Machine.department == department)
    if status:
        query = query.filter(Machine.status == status)
    if condition:
        query = query.filter(Machine.condition == condition)
        
    results = query.all()
    return [format_machine(m, w) for m, w in results]

@router.get("/{id}", response_model=MachineResponse)
def get_one_machine(id: int, db: Session = Depends(get_db)):
    result = db.query(Machine, Worker).outerjoin(Worker, Machine.current_operator_id == Worker.id).filter(Machine.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Machine not found")
    m, w = result
    return format_machine(m, w)

@router.put("/{id}", response_model=MachineResponse)
def update_machine(id: int, data: MachineUpdate, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.id == id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    if data.current_operator_id:
        worker = db.query(Worker).filter(Worker.id == data.current_operator_id).first()
        if not worker:
            raise HTTPException(status_code=404, detail="Operator (Worker) not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(machine, key, value)
        
    try:
        db.commit()
        db.refresh(machine)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Machine code already exists")
        
    worker = None
    if machine.current_operator_id:
        worker = db.query(Worker).filter(Worker.id == machine.current_operator_id).first()
        
    return format_machine(machine, worker)

@router.put("/{id}/status", response_model=MachineResponse)
def update_machine_status(id: int, data: MachineStatusUpdate, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.id == id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    previous_status = machine.status
    machine.status = data.status
    
    history = MachineStatusHistory(
        machine_id=machine.id,
        previous_status=previous_status,
        new_status=data.status,
        reason=data.reason,
        downtime_minutes=data.downtime_minutes,
        notes=data.notes
    )
    db.add(history)
    db.commit()
    db.refresh(machine)
    
    worker = None
    if machine.current_operator_id:
        worker = db.query(Worker).filter(Worker.id == machine.current_operator_id).first()
        
    return format_machine(machine, worker)

@router.get("/{id}/history", response_model=List[MachineStatusHistoryResponse])
def get_machine_history(id: int, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.id == id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    history = db.query(MachineStatusHistory).filter(MachineStatusHistory.machine_id == id).order_by(MachineStatusHistory.changed_at.desc()).all()
    return history

@router.delete("/{id}")
def delete_machine(id: int, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.id == id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    db.delete(machine)
    db.commit()
    return {"message": "Machine deleted successfully"}
