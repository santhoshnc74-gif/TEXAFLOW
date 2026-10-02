from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("production.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    prediction_type = Column(String, nullable=False)
    prediction_mode = Column(String, nullable=False)
    predicted_completion_date = Column(Date, nullable=True)
    predicted_remaining_days = Column(Integer, nullable=True)
    delay_risk = Column(String, nullable=True)
    predicted_delay_days = Column(Integer, nullable=True)
    current_workers = Column(Integer, nullable=True)
    required_workers = Column(Integer, nullable=True)
    extra_workers_required = Column(Integer, nullable=True)
    overtime_recommended = Column(Boolean, default=False)
    suggested_overtime_hours = Column(Float, nullable=True)
    completion_percentage = Column(Float, nullable=True)
    model_version = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    production = relationship("Production")
    order = relationship("Order")
