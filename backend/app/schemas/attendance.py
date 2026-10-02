from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime

class AttendanceBase(BaseModel):
    worker_id: int
    attendance_date: date
    status: str
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    shift: Optional[str] = None
    overtime_hours: Optional[float] = 0.0
    remarks: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    shift: Optional[str] = None
    overtime_hours: Optional[float] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Flattened worker fields for easy display
    employee_id: str
    worker_name: str
    department: str

    class Config:
        from_attributes = True

class BulkAttendanceCreate(BaseModel):
    records: List[AttendanceCreate]
