from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.machine import Machine, MachineStatusHistory
from app.models.order import Order
from app.models.production import Production, ProductionUpdate
import math

router = APIRouter()

@router.get("/workforce")
def get_workforce_analytics(start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    # Attendance trend
    query = db.query(Attendance.attendance_date, Attendance.status, func.count(Attendance.id)).filter(
        Attendance.attendance_date >= start_date,
        Attendance.attendance_date <= end_date
    ).group_by(Attendance.attendance_date, Attendance.status).all()

    trend_dict = {}
    for d, status, count in query:
        ds = d.isoformat()
        if ds not in trend_dict:
            trend_dict[ds] = {'date': ds, 'Present': 0, 'Absent': 0, 'On Leave': 0, 'Half Day': 0}
        if status in trend_dict[ds]:
            trend_dict[ds][status] = count
            
    attendance_trend = sorted(list(trend_dict.values()), key=lambda x: x['date'])

    # Department breakdown
    dept_query = db.query(Worker.department, func.count(Worker.id)).group_by(Worker.department).all()
    dept_breakdown = [{'department': dept or 'Unassigned', 'count': count} for dept, count in dept_query]

    return {
        "attendance_trend": attendance_trend,
        "department_breakdown": dept_breakdown
    }

@router.get("/machines")
def get_machine_analytics(start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    status_query = db.query(Machine.status, func.count(Machine.id)).group_by(Machine.status).all()
    status_breakdown = [{'status': s or 'Unknown', 'count': c} for s, c in status_query]

    # Downtime from history
    history = db.query(MachineStatusHistory).filter(
        MachineStatusHistory.changed_at >= start_date,
        MachineStatusHistory.changed_at <= datetime.combine(end_date, datetime.max.time())
    ).all()
    
    total_downtime = sum((h.downtime_minutes or 0) for h in history)
    
    # Downtime by machine
    machine_downtime = {}
    for h in history:
        if h.downtime_minutes:
            if h.machine_id not in machine_downtime:
                machine_downtime[h.machine_id] = 0
            machine_downtime[h.machine_id] += h.downtime_minutes
            
    top_downtime_machines = []
    for m_id, mins in sorted(machine_downtime.items(), key=lambda x: x[1], reverse=True)[:5]:
        m = db.query(Machine).filter(Machine.id == m_id).first()
        if m:
            top_downtime_machines.append({"machine_code": m.machine_code, "downtime_minutes": mins})

    return {
        "status_breakdown": status_breakdown,
        "total_downtime_minutes": total_downtime,
        "top_downtime_machines": top_downtime_machines
    }

@router.get("/orders")
def get_order_analytics(start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    status_query = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    status_breakdown = [{'status': s or 'Unknown', 'count': c} for s, c in status_query]

    priority_query = db.query(Order.priority, func.count(Order.id)).group_by(Order.priority).all()
    priority_breakdown = [{'priority': p or 'Normal', 'count': c} for p, c in priority_query]

    # Delivery performance
    delivered_orders = db.query(Order).filter(Order.status == 'Delivered').all()
    on_time = 0
    late = 0
    total_delay_days = 0
    
    for o in delivered_orders:
        if o.actual_delivery_date and o.expected_delivery_date:
            delay = (o.actual_delivery_date - o.expected_delivery_date).days
            if delay <= 0:
                on_time += 1
            else:
                late += 1
                total_delay_days += delay
                
    avg_delay = round(total_delay_days / late, 1) if late > 0 else 0

    return {
        "status_breakdown": status_breakdown,
        "priority_breakdown": priority_breakdown,
        "delivery_performance": {
            "on_time": on_time,
            "late": late,
            "avg_delay_days": avg_delay
        }
    }

@router.get("/production")
def get_production_analytics(start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    status_query = db.query(Production.status, func.count(Production.id)).group_by(Production.status).all()
    status_breakdown = [{'status': s or 'Unknown', 'count': c} for s, c in status_query]

    # Daily trend
    updates = db.query(ProductionUpdate.production_date, func.sum(ProductionUpdate.quantity_produced), func.sum(ProductionUpdate.rejected_quantity)).filter(
        ProductionUpdate.production_date >= start_date,
        ProductionUpdate.production_date <= end_date
    ).group_by(ProductionUpdate.production_date).order_by(ProductionUpdate.production_date).all()
    
    daily_trend = [{'date': d.isoformat(), 'produced': int(p or 0), 'rejected': int(r or 0)} for d, p, r in updates]

    # Dept performance
    dept_query = db.query(Production.department, func.sum(Production.target_quantity), func.sum(Production.completed_quantity), func.sum(Production.rejected_quantity)).group_by(Production.department).all()
    
    dept_performance = []
    total_prod = 0
    total_rej = 0
    for dept, tgt, cmp, rej in dept_query:
        cmp = int(cmp or 0)
        tgt = int(tgt or 0)
        rej = int(rej or 0)
        total_prod += cmp
        total_rej += rej
        dept_performance.append({
            'department': dept or 'Unassigned',
            'target': tgt,
            'completed': cmp,
            'rejected': rej,
            'completion_pct': round((cmp/tgt*100), 2) if tgt > 0 else 0
        })
        
    overall_rejection_rate = round((total_rej / total_prod * 100), 2) if total_prod > 0 else 0

    return {
        "status_breakdown": status_breakdown,
        "daily_trend": daily_trend,
        "department_performance": dept_performance,
        "overall_rejection_rate": overall_rejection_rate
    }
