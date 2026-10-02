from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class ProductionStageBase(BaseModel):
    stage_name: str
    department: Optional[str] = None
    sequence_number: int
    target_quantity: int = Field(gt=0)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    notes: Optional[str] = None

class ProductionStageCreate(ProductionStageBase):
    pass

class ProductionStageResponse(ProductionStageBase):
    id: int
    production_id: int
    completed_quantity: int
    rejected_quantity: int
    status: str
    actual_start_date: Optional[date]
    actual_end_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductionBase(BaseModel):
    production_code: str
    order_id: int
    department: str
    planned_start_date: date
    planned_end_date: date
    target_quantity: int = Field(gt=0)
    priority: Optional[str] = None
    supervisor_id: Optional[int] = None
    notes: Optional[str] = None

class ProductionCreate(ProductionBase):
    stages: Optional[List[ProductionStageCreate]] = None

class ProductionUpdate(BaseModel):
    department: Optional[str] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    target_quantity: Optional[int] = Field(None, gt=0)
    priority: Optional[str] = None
    supervisor_id: Optional[int] = None
    notes: Optional[str] = None

class ProductionResponse(ProductionBase):
    id: int
    actual_start_date: Optional[date]
    actual_end_date: Optional[date]
    completed_quantity: int
    rejected_quantity: int
    remaining_quantity: int
    status: str
    progress_percentage: float
    created_at: datetime
    updated_at: datetime

    order_number: Optional[str] = None
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    
    stages: List[ProductionStageResponse] = []

    class Config:
        from_attributes = True

class ProductionUpdateBase(BaseModel):
    stage_id: Optional[int] = None
    production_date: date
    worker_id: Optional[int] = None
    machine_id: Optional[int] = None
    quantity_produced: int = Field(default=0, ge=0)
    rejected_quantity: int = Field(default=0, ge=0)
    working_hours: Optional[Decimal] = None
    overtime_hours: Optional[Decimal] = None
    remarks: Optional[str] = None

class ProductionUpdateCreate(ProductionUpdateBase):
    pass

class ProductionUpdateResponse(ProductionUpdateBase):
    id: int
    production_id: int
    created_at: datetime
    
    stage_name: Optional[str] = None
    worker_name: Optional[str] = None
    machine_name: Optional[str] = None

    class Config:
        from_attributes = True
