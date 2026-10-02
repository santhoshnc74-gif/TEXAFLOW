from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.machine import Machine, MachineStatusHistory
from app.models.order import Order
from app.models.production import Production, ProductionUpdate
from app.models.prediction import PredictionHistory
from app.ai.prediction_service import predict_production

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    today = date.today()
    if not start_date:
        start_date = today - timedelta(days=30) # Default to last 30 days
    if not end_date:
        end_date = today

    # WORKERS
    total_workers = db.query(Worker).count()
    active_workers = db.query(Worker).filter(Worker.status == 'Active').count()
    
    today_attendance = db.query(Attendance).filter(Attendance.attendance_date == today).all()
    present_today = sum(1 for a in today_attendance if a.status == 'Present')
    absent_today = sum(1 for a in today_attendance if a.status == 'Absent')
    on_leave_today = sum(1 for a in today_attendance if a.status == 'On Leave')
    half_day_today = sum(1 for a in today_attendance if a.status == 'Half Day')
    
    attendance_percentage = round((present_today / active_workers * 100), 2) if active_workers > 0 else 0

    # MACHINES
    total_machines = db.query(Machine).count()
    running_machines = db.query(Machine).filter(Machine.status == 'Running').count()
    maintenance_machines = db.query(Machine).filter(Machine.status == 'Maintenance').count()
    breakdown_machines = db.query(Machine).filter(Machine.status == 'Breakdown').count()

    # ORDERS
    total_orders = db.query(Order).count()
    active_orders = db.query(Order).filter(Order.status.in_(['Pending', 'In Production'])).count()
    urgent_orders = db.query(Order).filter(Order.priority == 'Urgent', Order.status != 'Delivered').count()
    overdue_orders = db.query(Order).filter(Order.expected_delivery_date < today, Order.status != 'Delivered').count()

    # PRODUCTION
    active_productions = db.query(Production).filter(Production.status == 'In Progress').all()
    active_production_count = len(active_productions)
    
    # Calculate today's production from updates
    today_updates = db.query(ProductionUpdate).filter(ProductionUpdate.production_date == today).all()
    today_produced = sum(u.quantity_produced for u in today_updates)
    today_rejected = sum(u.rejected_quantity for u in today_updates)
    
    total_active_target = sum(p.target_quantity for p in active_productions)
    total_active_completed = sum(p.completed_quantity for p in active_productions)
    production_completion_percentage = round((total_active_completed / total_active_target * 100), 2) if total_active_target > 0 else 0

    return {
        "workers": {
            "total": total_workers,
            "active": active_workers,
            "present_today": present_today,
            "absent_today": absent_today,
            "on_leave_today": on_leave_today,
            "half_day_today": half_day_today,
            "attendance_percentage": attendance_percentage
        },
        "machines": {
            "total": total_machines,
            "running": running_machines,
            "maintenance": maintenance_machines,
            "breakdown": breakdown_machines
        },
        "orders": {
            "total": total_orders,
            "active": active_orders,
            "urgent": urgent_orders,
            "overdue": overdue_orders
        },
        "production": {
            "active": active_production_count,
            "today_produced": today_produced,
            "today_rejected": today_rejected,
            "completion_percentage": production_completion_percentage
        }
    }
