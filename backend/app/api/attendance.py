from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.attendance import Attendance
from app.models.worker import Worker
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse, BulkAttendanceCreate

router = APIRouter()

def format_attendance(att: Attendance, worker: Worker):
    return {
        "id": att.id,
        "worker_id": att.worker_id,
        "attendance_date": att.attendance_date,
        "status": att.status,
        "check_in": att.check_in,
        "check_out": att.check_out,
        "shift": att.shift,
        "overtime_hours": att.overtime_hours,
        "remarks": att.remarks,
        "created_at": att.created_at,
        "updated_at": att.updated_at,
        "employee_id": worker.employee_id,
        "worker_name": worker.name,
        "department": worker.department
    }

@router.post("/", response_model=AttendanceResponse)
def create_attendance(data: AttendanceCreate, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == data.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    try:
        new_att = Attendance(**data.model_dump())
        db.add(new_att)
        db.commit()
        db.refresh(new_att)
        return format_attendance(new_att, worker)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Attendance already recorded for this worker on this date.")

@router.post("/bulk")
def create_bulk_attendance(data: BulkAttendanceCreate, db: Session = Depends(get_db)):
    success_count = 0
    errors = []
    
    for record in data.records:
        worker = db.query(Worker).filter(Worker.id == record.worker_id).first()
        if not worker:
            errors.append(f"Worker ID {record.worker_id} not found")
            continue
            
        existing = db.query(Attendance).filter(
            Attendance.worker_id == record.worker_id,
            Attendance.attendance_date == record.attendance_date
        ).first()
        
        if existing:
            errors.append(f"Attendance already exists for {worker.employee_id} on {record.attendance_date}")
            continue
            
        new_att = Attendance(**record.model_dump())
        db.add(new_att)
        success_count += 1
        
    db.commit()
    return {"message": f"Successfully created {success_count} records", "errors": errors}

@router.get("/", response_model=List[AttendanceResponse])
def get_attendance(
    date: Optional[date] = None,
    worker_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Attendance, Worker).join(Worker, Attendance.worker_id == Worker.id)
    
    if date:
        query = query.filter(Attendance.attendance_date == date)
    if worker_id:
        query = query.filter(Attendance.worker_id == worker_id)
    if status:
        query = query.filter(Attendance.status == status)
        
    results = query.all()
    return [format_attendance(att, worker) for att, worker in results]

@router.get("/{id}", response_model=AttendanceResponse)
def get_one_attendance(id: int, db: Session = Depends(get_db)):
    result = db.query(Attendance, Worker).join(Worker, Attendance.worker_id == Worker.id).filter(Attendance.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    att, worker = result
    return format_attendance(att, worker)

@router.put("/{id}", response_model=AttendanceResponse)
def update_attendance(id: int, data: AttendanceUpdate, db: Session = Depends(get_db)):
    result = db.query(Attendance, Worker).join(Worker, Attendance.worker_id == Worker.id).filter(Attendance.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    att, worker = result
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(att, key, value)
        
    db.commit()
    db.refresh(att)
    return format_attendance(att, worker)

@router.delete("/{id}")
def delete_attendance(id: int, db: Session = Depends(get_db)):
    att = db.query(Attendance).filter(Attendance.id == id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    db.delete(att)
    db.commit()
    return {"message": "Attendance deleted successfully"}
