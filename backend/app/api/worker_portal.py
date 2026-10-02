from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user_account import UserAccount
from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.production import ProductionStage
from app.models.machine import Machine
from app.security.security import require_worker

router = APIRouter()

@router.get("/me/profile")
def get_my_profile(current_user: UserAccount = Depends(require_worker), db: Session = Depends(get_db)):
    if not current_user.worker_id:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    worker = db.query(Worker).filter(Worker.id == current_user.worker_id).first()
    return worker

@router.get("/me/attendance")
def get_my_attendance(current_user: UserAccount = Depends(require_worker), db: Session = Depends(get_db)):
    return db.query(Attendance).filter(Attendance.worker_id == current_user.worker_id).order_by(Attendance.attendance_date.desc()).limit(30).all()

@router.get("/me/production")
def get_my_production(current_user: UserAccount = Depends(require_worker), db: Session = Depends(get_db)):
    from app.models.production import ProductionWorker
    assignments = db.query(ProductionWorker).filter(ProductionWorker.worker_id == current_user.worker_id).all()
    result = []
    for a in assignments:
        prod = a.production
        stage = a.stage
        order = prod.order if prod else None
        
        result.append({
            "id": a.id,
            "production_code": prod.production_code if prod else "-",
            "order_number": order.order_number if order else "-",
            "product_name": order.product_name if order else "-",
            "stage": stage.stage_name if stage else "-",
            "role": a.role or "-",
            "status": a.status or prod.status,
            "start_date": prod.planned_start_date if prod else None,
            "end_date": prod.planned_end_date if prod else None,
            "progress_percentage": prod.progress_percentage if prod else 0,
            "target_quantity": prod.target_quantity if prod else 0,
            "completed_quantity": prod.completed_quantity if prod else 0,
            "remaining_quantity": prod.remaining_quantity if prod else 0
        })
    return result

@router.get("/me/machine")
def get_my_machine(current_user: UserAccount = Depends(require_worker), db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.current_operator_id == current_user.worker_id).first()
    return machine
