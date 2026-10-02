import os
import pandas as pd
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.production import Production, ProductionUpdate
from app.models.order import Order
from app.models.worker import Worker
from app.ai.fallback_engine import calculate_rule_based_prediction
from app.ai.model_training import get_ai_status, MODEL_DURATION_PATH, MODEL_DELAY_PATH
import joblib
import math

def predict_production(production: Production, db: Session):
    status = get_ai_status()
    
    if not status.get("model_available") or not os.path.exists(MODEL_DURATION_PATH):
        # Fallback to rule-based
        return calculate_rule_based_prediction(production, db)
        
    try:
        # Try ML Prediction
        reg = joblib.load(MODEL_DURATION_PATH)
        clf = joblib.load(MODEL_DELAY_PATH)
        
        order = db.query(Order).filter(Order.id == production.order_id).first()
        
        # Prepare features for this production
        features = pd.DataFrame([{
            'target_quantity': production.target_quantity,
            'planned_duration': (production.planned_end_date - production.planned_start_date).days,
            'order_quantity': order.quantity if order else production.target_quantity,
            'priority_encoded': 1 if production.priority in ['High', 'Urgent'] else 0
        }])
        
        predicted_total_duration = reg.predict(features)[0]
        delay_class = clf.predict(features)[0]
        
        # Calculate derived fields
        today = date.today()
        start_date = production.actual_start_date or production.planned_start_date
        days_elapsed = (today - start_date).days if (today - start_date).days > 0 else 0
        
        predicted_remaining_days = max(0, int(predicted_total_duration - days_elapsed))
        predicted_completion_date = today + timedelta(days=predicted_remaining_days)
        
        expected_delivery = order.expected_delivery_date
        delay_days = (predicted_completion_date - expected_delivery).days
        
        if delay_days <= 0 and delay_class == 0:
            delay_risk = "Low"
            predicted_delay_days = 0
        elif delay_days <= 3 and delay_class == 0:
            delay_risk = "Medium"
            predicted_delay_days = delay_days
        else:
            delay_risk = "High"
            predicted_delay_days = max(delay_days, 1) # If classifier says delayed but math says no, assume 1 day delay min
            
        # Calculate stats for response
        updates = db.query(ProductionUpdate).filter(ProductionUpdate.production_id == production.id).all()
        if len(updates) > 0:
            total_produced = sum(u.quantity_produced for u in updates)
            unique_days = len(set(u.production_date for u in updates))
            avg_daily = total_produced / unique_days if unique_days > 0 else 0
        else:
            avg_daily = 0
            
        remaining_qty = production.remaining_quantity
        remaining_days_to_deadline = (expected_delivery - today).days
        required_daily_production = math.ceil(remaining_qty / remaining_days_to_deadline) if remaining_days_to_deadline > 0 else remaining_qty
        
        current_workers = db.query(Worker).count()
        productivity_per_worker = avg_daily / current_workers if current_workers > 0 and avg_daily > 0 else 10
        required_workers = math.ceil(required_daily_production / productivity_per_worker) if productivity_per_worker > 0 else current_workers
        
        extra_workers_required = max(0, required_workers - current_workers)
        labour_shortage = extra_workers_required > 0
        
        overtime_recommended = labour_shortage
        suggested_overtime = round(min(4.0, (extra_workers_required / current_workers) * 8.0), 1) if current_workers > 0 and overtime_recommended else 0.0

        explanation = "ML models used for prediction."
        if delay_risk == "High":
            explanation += " Model predicts a high probability of missing the delivery deadline based on historical patterns."
            
        return {
            "production_id": production.id,
            "production_code": production.production_code,
            "prediction_mode": "ml",
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
        
    except Exception as e:
        print(f"ML Prediction failed: {str(e)}")
        # Fallback if ML fails for any reason
        return calculate_rule_based_prediction(production, db)
