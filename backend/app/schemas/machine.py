from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class MachineBase(BaseModel):
    machine_code: str
    machine_name: str
    machine_type: str
    department: str
    brand: Optional[str] = None
    model: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = "Available"
    condition: Optional[str] = "Good"
    current_operator_id: Optional[int] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    notes: Optional[str] = None

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    machine_code: Optional[str] = None
    machine_name: Optional[str] = None
    machine_type: Optional[str] = None
    department: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = None
    condition: Optional[str] = None
    current_operator_id: Optional[int] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    notes: Optional[str] = None

class MachineResponse(MachineBase):
    id: int
    created_at: datetime
    updated_at: datetime
    operator_name: Optional[str] = None

    class Config:
        from_attributes = True

class MachineStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None
    downtime_minutes: Optional[int] = 0
    notes: Optional[str] = None

class MachineStatusHistoryResponse(BaseModel):
    id: int
    machine_id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_at: datetime
    reason: Optional[str] = None
    downtime_minutes: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True
