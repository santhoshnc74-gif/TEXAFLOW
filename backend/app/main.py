from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.core.database import get_db
from app.api import workers
from app.api import attendance
from app.api import machines
from app.api import customers
from app.api import orders
from app.api import production
from app.api import ai_predictions
from app.api import ai_import
from app.api import dashboard
from app.api import analytics
from app.api import reports

app = FastAPI(title="TEXFLOW API")

# Configure CORS for local development and production
origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

import os
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth
from app.api import admin_users
from app.api import worker_portal
from app.security.security import require_admin
from fastapi import Depends

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_users.router, prefix="/api/admin", tags=["admin_users"])
app.include_router(worker_portal.router, prefix="/api/worker", tags=["worker_portal"])

# Protect management routes
app.include_router(workers.router, prefix="/api/workers", tags=["workers"], dependencies=[Depends(require_admin)])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"], dependencies=[Depends(require_admin)])
app.include_router(machines.router, prefix="/api/machines", tags=["machines"], dependencies=[Depends(require_admin)])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"], dependencies=[Depends(require_admin)])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"], dependencies=[Depends(require_admin)])
app.include_router(production.router, prefix="/api/production", tags=["production"], dependencies=[Depends(require_admin)])
app.include_router(ai_predictions.router, prefix="/api/ai", tags=["ai"], dependencies=[Depends(require_admin)])
app.include_router(ai_import.router, prefix="/api/ai/import", tags=["ai import"], dependencies=[Depends(require_admin)])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(require_admin)])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"], dependencies=[Depends(require_admin)])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"], dependencies=[Depends(require_admin)])

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "TEXFLOW Backend Connected"
    }

@app.get("/api/database/health")
def database_health_check(db: Session = Depends(get_db)):
    try:
        # Try to execute a simple query to check the connection
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "message": "TEXFLOW PostgreSQL Connected"
        }
    except (OperationalError, SQLAlchemyError) as e:
        # Return a safe error message without exposing credentials or stack trace
        return {
            "status": "error",
            "database": "disconnected",
            "message": "PostgreSQL connection failed"
        }

