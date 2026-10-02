from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class CurrentUserResponse(BaseModel):
    id: int
    username: str
    role: str
    worker_id: Optional[int] = None

class WorkerAccountCreate(BaseModel):
    worker_id: int
    username: str
    password: str
    must_change_password: bool = True

class WorkerAccountResponse(BaseModel):
    id: int
    username: str
    role: str
    worker_id: Optional[int]
    is_active: bool
    must_change_password: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    new_password: str
    must_change_password: bool = True
