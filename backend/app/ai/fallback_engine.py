from datetime import date, timedelta
from app.models.production import Production, ProductionUpdate
from app.models.order import Order
from app.models.worker import Worker
from sqlalchemy.orm import Session
import math

def calculate_rule_based_prediction(production: Production, db: Session):
    # Fetch required data
    order = db.query(Order).filter(Order.id == production.order_id).first()
    updates = db.query(ProductionUpdate).filter(ProductionUpdate.production_id == production.id).all()
    
    # Calculate Average Daily Production
    if len(updates) > 0:
        total_produced = sum(u.quantity_produced for u in updates)
        unique_days = len(set(u.production_date for u in updates))
        avg_daily = total_produced / unique_days if unique_days > 0 else 0
    else:
        avg_daily = 0
        
    remaining_qty = production.remaining_quantity
    
    # Predicted remaining days
    if avg_daily > 0:
        predicted_remaining_days = math.ceil(remaining_qty / avg_daily)
    else:
        # If no production happened yet, estimate based on planned duration
        planned_days = (production.planned_end_date - production.planned_start_date).days
        if planned_days > 0 and production.target_quantity > 0:
            avg_daily = production.target_quantity / planned_days
            predicted_remaining_days = math.ceil(remaining_qty / avg_daily) if avg_daily > 0 else 0
        else:
            predicted_remaining_days = 0
            
    today = date.today()
    predicted_completion_date = today + timedelta(days=predicted_remaining_days)
    
    expected_delivery = order.expected_delivery_date
    delay_days = (predicted_completion_date - expected_delivery).days
    
    if delay_days <= 0:
        delay_risk = "Low"
        predicted_delay_days = 0
    elif delay_days <= 3:
        delay_risk = "Medium"
        predicted_delay_days = delay_days
    else:
        delay_risk = "High"
        predicted_delay_days = delay_days
        
    # Required daily production to meet deadline
    remaining_days_to_deadline = (expected_delivery - today).days
    if remaining_days_to_deadline > 0:
        required_daily_production = math.ceil(remaining_qty / remaining_days_to_deadline)
    else:
        required_daily_production = remaining_qty # Needs to be done today

    # Worker calculation (Simplistic rule: assuming current avg daily is produced by current workers)
    current_workers = db.query(Worker).count() # Simply use total workers for this fallback
    # To be more accurate, we should count workers assigned to this production
    
    if avg_daily > 0:
        productivity_per_worker = avg_daily / current_workers if current_workers > 0 else avg_daily
    else:
        productivity_per_worker = 10 # Default arbitrary fallback 
        
    if productivity_per_worker > 0:
        required_workers = math.ceil(required_daily_production / productivity_per_worker)
    else:
        required_workers = current_workers
        
    extra_workers_required = max(0, required_workers - current_workers)
    labour_shortage = extra_workers_required > 0
    
    # Overtime
    overtime_recommended = False
    suggested_overtime = 0.0
    if labour_shortage and extra_workers_required > 0:
        overtime_recommended = True
        # Suggest proportional overtime
        suggested_overtime = round(min(4.0, (extra_workers_required / current_workers) * 8.0), 1) if current_workers > 0 else 2.0

    # Explanation
    explanation = "Rule-based estimation used."
    if avg_daily < required_daily_production:
        explanation += f" Current daily production ({avg_daily:.1f}) is below the required rate ({required_daily_production}) to meet the deadline."
        
    return {
        "production_id": production.id,
        "production_code": production.production_code,
        "prediction_mode": "rule_based",
        "completion_percentage": production.progress_percentage,
        "remaining_quantity": remaining_qty,
        "average_daily_production": round(avg_daily, 2),
        "required_daily_production": required_daily_production,
        "predicted_remaining_days": predicted_remaining_days,
        "predicted_completion_date": predicted_completion_date,
        "expected_delivery_date": expected_delivery,
        "predicted_delay_days": predicted_delay_days,
        "delay_risk": delay_risk,
        "current_workers": current_workers,
        "required_workers": required_workers,
        "extra_workers_required": extra_workers_required,
        "labour_shortage": labour_shortage,
        "overtime_recommended": overtime_recommended,
        "suggested_overtime_hours": suggested_overtime,
        "explanation": explanation
    }
