from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.production import Production
from app.models.order import Order
from app.models.prediction import PredictionHistory
from app.schemas.prediction import PredictionResponse, PredictionHistoryResponse, AIStatusResponse
from app.ai.model_training import train_models, get_ai_status
from app.ai.prediction_service import predict_production
from typing import List

router = APIRouter()

@router.get("/status", response_model=AIStatusResponse)
def status():
    return get_ai_status()

@router.post("/train")
def train(db: Session = Depends(get_db)):
    result = train_models(db)
    return result

@router.get("/predict/production/{production_id}", response_model=PredictionResponse)
def get_production_prediction(production_id: int, db: Session = Depends(get_db)):
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise HTTPException(status_code=404, detail="Production not found")
        
    result = predict_production(production, db)
    
    # Save to history
    history = PredictionHistory(
        production_id=result['production_id'],
        order_id=production.order_id,
        prediction_type="production",
        prediction_mode=result['prediction_mode'],
        predicted_completion_date=result['predicted_completion_date'],
        predicted_remaining_days=result['predicted_remaining_days'],
        delay_risk=result['delay_risk'],
        predicted_delay_days=result['predicted_delay_days'],
        current_workers=result['current_workers'],
        required_workers=result['required_workers'],
        extra_workers_required=result['extra_workers_required'],
        overtime_recommended=result['overtime_recommended'],
        suggested_overtime_hours=result['suggested_overtime_hours'],
        completion_percentage=result['completion_percentage'],
        model_version=get_ai_status().get('model_version')
    )
    db.add(history)
    db.commit()
    
    return result

@router.get("/predict/order/{order_id}", response_model=PredictionResponse)
def get_order_prediction(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    production = db.query(Production).filter(Production.order_id == order_id).order_by(Production.id.desc()).first()
    if not production:
        raise HTTPException(status_code=400, detail="No production plan found for this order to predict.")
        
    result = predict_production(production, db)
    
    # Save to history
    history = PredictionHistory(
        production_id=result['production_id'],
        order_id=order_id,
        prediction_type="order",
        prediction_mode=result['prediction_mode'],
        predicted_completion_date=result['predicted_completion_date'],
        predicted_remaining_days=result['predicted_remaining_days'],
        delay_risk=result['delay_risk'],
        predicted_delay_days=result['predicted_delay_days'],
        current_workers=result['current_workers'],
        required_workers=result['required_workers'],
        extra_workers_required=result['extra_workers_required'],
        overtime_recommended=result['overtime_recommended'],
        suggested_overtime_hours=result['suggested_overtime_hours'],
        completion_percentage=result['completion_percentage'],
        model_version=get_ai_status().get('model_version')
    )
    db.add(history)
    db.commit()
    
    return result

@router.get("/history/{production_id}", response_model=List[PredictionHistoryResponse])
def get_prediction_history(production_id: int, db: Session = Depends(get_db)):
    history = db.query(PredictionHistory).filter(PredictionHistory.production_id == production_id).order_by(PredictionHistory.created_at.desc()).all()
    return history
