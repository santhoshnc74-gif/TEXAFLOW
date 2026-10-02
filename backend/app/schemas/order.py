from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class OrderBase(BaseModel):
    order_number: str
    customer_id: int
    product_name: str
    product_category: Optional[str] = None
    fabric_type: Optional[str] = None
    color: Optional[str] = None
    size_details: Optional[str] = None
    quantity: int = Field(gt=0)
    completed_quantity: int = Field(default=0, ge=0)
    order_date: date
    expected_delivery_date: date
    actual_delivery_date: Optional[date] = None
    priority: Optional[str] = "Normal"
    status: Optional[str] = "Pending"
    unit_price: Optional[Decimal] = None
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    order_number: Optional[str] = None
    customer_id: Optional[int] = None
    product_name: Optional[str] = None
    product_category: Optional[str] = None
    fabric_type: Optional[str] = None
    color: Optional[str] = None
    size_details: Optional[str] = None
    quantity: Optional[int] = Field(None, gt=0)
    completed_quantity: Optional[int] = Field(None, ge=0)
    order_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    unit_price: Optional[Decimal] = None
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    total_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    progress_percentage: float = 0.0

    # Flat customer data for easy display
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True
