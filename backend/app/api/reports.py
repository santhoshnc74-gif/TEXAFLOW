from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.security.security import require_admin
from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.machine import Machine, MachineStatusHistory
from app.models.order import Order
from app.models.production import Production, ProductionUpdate
from app.models.customer import Customer
from typing import List, Dict, Any, Optional

router = APIRouter()

def parse_dates(start_date: Optional[str], end_date: Optional[str]):
    try:
        sd = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else (date.today() - timedelta(days=30))
        ed = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else date.today()
        return sd, ed
    except ValueError:
        return date.today() - timedelta(days=30), date.today()

@router.get("/factory-summary")
def get_factory_summary_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    sd, ed = parse_dates(start_date, end_date)
        
    workers_total = db.query(Worker).count()
    machines_total = db.query(Machine).count()
    machines_running = db.query(Machine).filter(Machine.status == 'Running').count()
    machines_stopped = db.query(Machine).filter(Machine.status == 'Stopped').count()
    machines_breakdown = db.query(Machine).filter(Machine.status == 'Breakdown').count()
    
    orders_total = db.query(Order).count()
    orders_pending = db.query(Order).filter(Order.status == 'Pending').count()
    orders_production = db.query(Order).filter(Order.status == 'In Production').count()
    orders_delivered = db.query(Order).filter(Order.status == 'Delivered').count()
    orders_overdue = db.query(Order).filter(Order.expected_delivery_date < date.today(), Order.status != 'Delivered').count()
    
    productions_active = db.query(Production).filter(Production.status.in_(['In Progress', 'Planned'])).count()
    productions_completed = db.query(Production).filter(Production.status == 'Completed').count()
    
    # Calculate average completion percentage safely
    avg_completion = db.query(func.avg(Production.progress_percentage)).scalar() or 0.0
    
    # Get attendance for today or end_date to show present/absent counts
    att_present = db.query(Attendance).filter(Attendance.attendance_date == ed, Attendance.status == 'Present').count()
    att_absent = db.query(Attendance).filter(Attendance.attendance_date == ed, Attendance.status == 'Absent').count()
    att_leave = db.query(Attendance).filter(Attendance.attendance_date == ed, Attendance.status == 'On Leave').count()
    att_half = db.query(Attendance).filter(Attendance.attendance_date == ed, Attendance.status == 'Half Day').count()

    return {
        "report_type": "Factory Summary",
        "date_range": f"{sd} to {ed}",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Workers": workers_total,
            "Present Today": att_present,
            "Absent Today": att_absent,
            "On Leave Today": att_leave,
            "Half Day Today": att_half,
            "Total Machines": machines_total,
            "Running Machines": machines_running,
            "Stopped Machines": machines_stopped,
            "Breakdown Machines": machines_breakdown,
            "Total Orders": orders_total,
            "Pending Orders": orders_pending,
            "In Production Orders": orders_production,
            "Delivered Orders": orders_delivered,
            "Overdue Orders": orders_overdue,
            "Active Production": productions_active,
            "Completed Production": productions_completed,
            "Average Production Completion": f"{avg_completion:.1f}%"
        },
        "data": [] # No detailed data for summary
    }

@router.get("/attendance")
def get_attendance_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    sd, ed = parse_dates(start_date, end_date)
    
    query = db.query(Attendance).join(Worker).filter(Attendance.attendance_date >= sd, Attendance.attendance_date <= ed).order_by(Attendance.attendance_date.desc())
    records = query.all()
    
    total = len(records)
    present = sum(1 for r in records if r.status == 'Present')
    absent = sum(1 for r in records if r.status == 'Absent')
    leave = sum(1 for r in records if r.status == 'On Leave')
    half_day = sum(1 for r in records if r.status == 'Half Day')
    
    data = []
    for r in records:
        w_hours = 0
        if r.check_in and r.check_out:
            try:
                cin = datetime.combine(date.today(), r.check_in)
                cout = datetime.combine(date.today(), r.check_out)
                w_hours = round((cout - cin).total_seconds() / 3600, 2)
            except:
                pass
                
        data.append({
            "Date": r.attendance_date.isoformat(),
            "Employee ID": r.worker.employee_id,
            "Worker Name": r.worker.name,
            "Department": r.worker.department,
            "Status": r.status,
            "Check In": r.check_in.strftime('%H:%M') if r.check_in else "-",
            "Check Out": r.check_out.strftime('%H:%M') if r.check_out else "-",
            "Working Hours": str(w_hours)
        })

    return {
        "report_type": "Attendance Report",
        "date_range": f"{sd} to {ed}",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Attendance Records": total,
            "Present": present,
            "Absent": absent,
            "On Leave": leave,
            "Half Day": half_day
        },
        "data": data
    }

@router.get("/workers")
def get_worker_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    sd, ed = parse_dates(start_date, end_date)
    
    records = db.query(Worker).order_by(Worker.name).all()
    
    total = len(records)
    active = sum(1 for r in records if r.status == 'Active')
    inactive = total - active
    
    data = []
    for r in records:
        data.append({
            "Employee ID": r.employee_id,
            "Name": r.name,
            "Department": r.department,
            "Designation": r.designation or "-",
            "Phone": r.phone or "-",
            "Email": r.email or "-",
            "Status": r.status,
            "Join Date": r.joining_date.isoformat() if r.joining_date else "-"
        })

    return {
        "report_type": "Worker Report",
        "date_range": "All Time",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Workers": total,
            "Active Workers": active,
            "Inactive Workers": inactive
        },
        "data": data
    }

@router.get("/production")
def get_production_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    sd, ed = parse_dates(start_date, end_date)
    
    records = db.query(Production).join(Order).filter(
        Production.planned_start_date >= sd, 
        Production.planned_start_date <= ed
    ).all()
    
    total = len(records)
    active = sum(1 for r in records if r.status in ['In Progress', 'Planned'])
    completed = sum(1 for r in records if r.status == 'Completed')
    avg_comp = sum(r.progress_percentage for r in records) / total if total > 0 else 0
    
    data = []
    for r in records:
        data.append({
            "Production ID": r.production_code,
            "Order No": r.order.order_number,
            "Department": r.department,
            "Target Quantity": r.target_quantity,
            "Completed Quantity": r.completed_quantity,
            "Progress": f"{r.progress_percentage}%",
            "Start Date": r.planned_start_date.isoformat(),
            "Completion Date": r.actual_end_date.isoformat() if r.actual_end_date else "-",
            "Status": r.status
        })

    return {
        "report_type": "Production Report",
        "date_range": f"{sd} to {ed}",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Production Records": total,
            "Active Production": active,
            "Completed Production": completed,
            "Average Completion %": f"{avg_comp:.1f}%"
        },
        "data": data
    }

@router.get("/machines")
def get_machine_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    records = db.query(Machine).order_by(Machine.machine_name).all()
    
    total = len(records)
    running = sum(1 for r in records if r.status == 'Running')
    stopped = sum(1 for r in records if r.status == 'Stopped')
    breakdown = sum(1 for r in records if r.status == 'Breakdown')
    maintenance = sum(1 for r in records if r.status == 'Maintenance')
    
    data = []
    for r in records:
        data.append({
            "Machine ID": r.machine_code,
            "Machine Name": r.machine_name,
            "Machine Type": r.machine_type,
            "Department": r.department,
            "Status": r.status,
            "Assigned Worker": r.current_operator.name if r.current_operator else "-",
            "Last Maintenance": r.last_maintenance_date.isoformat() if r.last_maintenance_date else "-",
            "Next Maintenance": r.next_maintenance_date.isoformat() if r.next_maintenance_date else "-"
        })

    return {
        "report_type": "Machine Report",
        "date_range": "All Time",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Machines": total,
            "Running": running,
            "Stopped": stopped,
            "Breakdown": breakdown,
            "Maintenance": maintenance
        },
        "data": data
    }

@router.get("/orders")
def get_order_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    sd, ed = parse_dates(start_date, end_date)
    
    records = db.query(Order).join(Customer).filter(
        Order.order_date >= sd,
        Order.order_date <= ed
    ).order_by(Order.order_date.desc()).all()
    
    total = len(records)
    pending = sum(1 for r in records if r.status == 'Pending')
    in_prod = sum(1 for r in records if r.status == 'In Production')
    delivered = sum(1 for r in records if r.status == 'Delivered')
    urgent = sum(1 for r in records if r.priority in ['High', 'Urgent'])
    overdue = sum(1 for r in records if r.expected_delivery_date < date.today() and r.status != 'Delivered')
    
    data = []
    for r in records:
        progress = f"{(r.completed_quantity / r.quantity * 100):.1f}%" if r.quantity > 0 else "0%"
        data.append({
            "Order No": r.order_number,
            "Customer": r.customer.customer_name,
            "Product": r.product_name,
            "Quantity": r.quantity,
            "Order Date": r.order_date.isoformat(),
            "Delivery Date": r.expected_delivery_date.isoformat(),
            "Priority": r.priority,
            "Status": r.status,
            "Progress": progress
        })

    return {
        "report_type": "Order Report",
        "date_range": f"{sd} to {ed}",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Orders": total,
            "Pending": pending,
            "In Production": in_prod,
            "Delivered": delivered,
            "Urgent": urgent,
            "Overdue": overdue
        },
        "data": data
    }

@router.get("/customers")
def get_customer_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    records = db.query(Customer).order_by(Customer.customer_name).all()
    
    total = len(records)
    
    data = []
    for r in records:
        data.append({
            "Customer ID": r.customer_code,
            "Customer Name": r.customer_name,
            "Company": r.company_name or "-",
            "Phone": r.phone or "-",
            "Email": r.email or "-",
            "City": r.city or "-",
            "State": r.state or "-",
            "Contact Person": r.customer_name
        })

    return {
        "report_type": "Customer Report",
        "date_range": "All Time",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Customers": total
        },
        "data": data
    }
