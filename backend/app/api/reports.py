from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.machine import Machine, MachineStatusHistory
from app.models.order import Order
from app.models.production import Production, ProductionUpdate
from app.models.prediction import PredictionHistory

router = APIRouter()

@router.get("/factory-summary")
def get_factory_summary_report(start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
        
    workers = db.query(Worker).count()
    machines = db.query(Machine).count()
    orders = db.query(Order).count()
    productions = db.query(Production).count()
    
    # Simple summary dict
    return {
        "report_type": "Factory Summary",
        "date_range": f"{start_date} to {end_date}",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "Total Workers": workers,
            "Total Machines": machines,
            "Total Orders": orders,
            "Total Production Plans": productions
        }
    }
