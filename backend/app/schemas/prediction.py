from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class PredictionResponse(BaseModel):
    production_id: int
    production_code: str
    prediction_mode: str
    completion_percentage: float
    remaining_quantity: int
    average_daily_production: float
    required_daily_production: float
    predicted_remaining_days: int
    predicted_completion_date: date
    expected_delivery_date: date
    predicted_delay_days: int
    delay_risk: str
    current_workers: int
    required_workers: int
    extra_workers_required: int
    labour_shortage: bool
    overtime_recommended: bool
    suggested_overtime_hours: float
    explanation: Optional[str] = None

class PredictionHistoryResponse(BaseModel):
    id: int
    production_id: int
    order_id: int
    prediction_type: str
    prediction_mode: str
    predicted_completion_date: Optional[date]
    predicted_remaining_days: Optional[int]
    delay_risk: Optional[str]
    predicted_delay_days: Optional[int]
    current_workers: Optional[int]
    required_workers: Optional[int]
    extra_workers_required: Optional[int]
    overtime_recommended: bool
    suggested_overtime_hours: Optional[float]
    completion_percentage: Optional[float]
    model_version: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIStatusResponse(BaseModel):
    model_available: bool
    prediction_mode: str
    model_version: Optional[str] = None
    trained_at: Optional[datetime] = None
    training_records: int = 0
    evaluation_metrics: Optional[dict] = None
    completed_records_count: int = 0

