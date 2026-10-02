from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import get_db
from app.models.user_account import UserAccount
from app.schemas.auth import (
    LoginRequest, TokenResponse, CurrentUserResponse, PasswordChangeRequest
)
from app.security.security import (
    verify_password, get_password_hash, create_access_token, get_current_user
)

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = form_data.username.strip()
    user = db.query(UserAccount).filter(UserAccount.username == username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is inactive. Contact administrator."
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "worker_id": user.worker_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "worker_id": user.worker_id,
            "must_change_password": user.must_change_password
        }
    }

@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: UserAccount = Depends(get_current_user)):
    return current_user

@router.put("/change-password")
def change_password(request: PasswordChangeRequest, current_user: UserAccount = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.password_hash = get_password_hash(request.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Password changed successfully"}
