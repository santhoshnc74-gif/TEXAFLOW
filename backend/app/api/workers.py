from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.models.worker import Worker
from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse

router = APIRouter()

@router.post("/", response_model=WorkerResponse)
def create_worker(worker: WorkerCreate, db: Session = Depends(get_db)):
    db_worker = db.query(Worker).filter(Worker.employee_id == worker.employee_id).first()
    if db_worker:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    new_worker = Worker(**worker.model_dump())
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    return new_worker

@router.get("/search", response_model=List[WorkerResponse])
def search_workers(
    q: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Worker)
    
    if q:
        query = query.filter(
            or_(
                Worker.name.ilike(f"%{q}%"),
                Worker.employee_id.ilike(f"%{q}%")
            )
        )
    if department:
        query = query.filter(Worker.department == department)
    if status:
        query = query.filter(Worker.status == status)
        
    return query.all()

@router.get("/", response_model=List[WorkerResponse])
def get_workers(db: Session = Depends(get_db)):
    return db.query(Worker).all()

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker

@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(worker_id: int, worker_update: WorkerUpdate, db: Session = Depends(get_db)):
    db_worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not db_worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    # Check employee ID uniqueness if it's being updated
    if worker_update.employee_id and worker_update.employee_id != db_worker.employee_id:
        existing = db.query(Worker).filter(Worker.employee_id == worker_update.employee_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID already exists")

    update_data = worker_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_worker, key, value)
        
    db.commit()
    db.refresh(db_worker)
    return db_worker

@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    db_worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not db_worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    db.delete(db_worker)
    db.commit()
    return {"message": "Worker deleted successfully"}
