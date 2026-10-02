from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime

class WorkerBase(BaseModel):
    employee_id: str = Field(..., description="Unique employee identifier")
    name: str = Field(..., description="Worker's full name")
    department: str = Field(..., description="Assigned department")
    designation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    shift: Optional[str] = None
    joining_date: Optional[date] = None
    status: str = Field(default="Active", description="Current status of the worker")

class WorkerCreate(WorkerBase):
    pass

class WorkerUpdate(BaseModel):
    employee_id: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    shift: Optional[str] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None

class WorkerResponse(WorkerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
