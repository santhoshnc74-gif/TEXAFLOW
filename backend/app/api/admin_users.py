from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user_account import UserAccount
from app.models.worker import Worker
from app.schemas.auth import (
    WorkerAccountCreate, WorkerAccountResponse, PasswordResetRequest
)
from app.security.security import require_admin, get_password_hash

router = APIRouter()

@router.get("/", response_model=List[WorkerAccountResponse])
def get_user_accounts(db: Session = Depends(get_db), current_admin: UserAccount = Depends(require_admin)):
    return db.query(UserAccount).all()

@router.post("/worker-accounts", response_model=WorkerAccountResponse)
def create_worker_account(request: WorkerAccountCreate, db: Session = Depends(get_db), current_admin: UserAccount = Depends(require_admin)):
    worker = db.query(Worker).filter(Worker.id == request.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    existing_account = db.query(UserAccount).filter(UserAccount.worker_id == request.worker_id).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="This worker already has a login account.")
        
    existing_username = db.query(UserAccount).filter(UserAccount.username == request.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists.")
        
    new_user = UserAccount(
        username=request.username,
        password_hash=get_password_hash(request.password),
        role="WORKER",
        worker_id=request.worker_id,
        must_change_password=request.must_change_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}/reset-password")
def reset_password(user_id: int, request: PasswordResetRequest, db: Session = Depends(get_db), current_admin: UserAccount = Depends(require_admin)):
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(request.new_password)
    user.must_change_password = request.must_change_password
    db.commit()
    return {"message": "Password reset successfully."}

@router.put("/{user_id}/status")
def change_status(user_id: int, is_active: bool, db: Session = Depends(get_db), current_admin: UserAccount = Depends(require_admin)):
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent admin from disabling themselves to avoid lockout
    if user.id == current_admin.id and not is_active:
        raise HTTPException(status_code=400, detail="Cannot disable your own admin account")
        
    user.is_active = is_active
    db.commit()
    return {"message": f"Account {'activated' if is_active else 'disabled'} successfully"}
