from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.production import Production
from app.models.order import Order
from app.security.security import require_admin
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import io
import re

router = APIRouter(prefix="/import")

class GoogleSheetImportRequest(BaseModel):
    url: str

class HistoricalProductionRow(BaseModel):
    production_code: str
    order_id: int
    department: str
    target_quantity: int
    completed_quantity: int
    planned_start_date: str
    planned_end_date: str
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    status: str
    is_valid: bool
    validation_error: Optional[str] = None

class ImportPreviewResponse(BaseModel):
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    rows: List[HistoricalProductionRow]

class ConfirmImportRequest(BaseModel):
    rows: List[HistoricalProductionRow]

def process_dataframe(df: pd.DataFrame, db: Session) -> dict:
    # Rename columns to standard ones if needed, or assume template headers
    # expected: production_code, order_id, department, target_quantity, completed_quantity, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status
    
    rows = []
    total = 0
    valid = 0
    invalid = 0
    duplicate = 0
    
    # Fill nan with empty string
    df = df.fillna('')
    
    for index, row in df.iterrows():
        total += 1
        r_dict = row.to_dict()
        
        prod_code = str(r_dict.get('production_code', '')).strip()
        order_id_str = str(r_dict.get('order_id', '')).strip()
        department = str(r_dict.get('department', 'General')).strip()
        target_qty = str(r_dict.get('target_quantity', '0')).strip()
        comp_qty = str(r_dict.get('completed_quantity', '0')).strip()
        p_start = str(r_dict.get('planned_start_date', '')).strip()
        p_end = str(r_dict.get('planned_end_date', '')).strip()
        a_start = str(r_dict.get('actual_start_date', '')).strip()
        a_end = str(r_dict.get('actual_end_date', '')).strip()
        status = str(r_dict.get('status', 'Completed')).strip()
        
        is_valid = True
        err = []
        
        # Validation
        if not prod_code:
            is_valid = False
            err.append("Missing production_code")
            
        if not order_id_str.isdigit():
            is_valid = False
            err.append("Invalid order_id (must be integer)")
        else:
            # Check if order exists
            order = db.query(Order).filter(Order.id == int(order_id_str)).first()
            if not order:
                is_valid = False
                err.append(f"Order ID {order_id_str} does not exist")
                
        if status != 'Completed':
            is_valid = False
            err.append("Status must be 'Completed' for historical training data")
            
        if not a_start or not a_end:
            is_valid = False
            err.append("Missing actual start or completion date")
            
        if is_valid:
            # Check duplicate
            existing = db.query(Production).filter(Production.production_code == prod_code).first()
            if existing:
                is_valid = False
                err.append("Duplicate production_code")
                duplicate += 1
                
        if is_valid:
            valid += 1
        elif not existing:
            invalid += 1
            
        rows.append(HistoricalProductionRow(
            production_code=prod_code,
            order_id=int(order_id_str) if order_id_str.isdigit() else 0,
            department=department or 'General',
            target_quantity=int(float(target_qty)) if target_qty.replace('.','',1).isdigit() else 0,
            completed_quantity=int(float(comp_qty)) if comp_qty.replace('.','',1).isdigit() else 0,
            planned_start_date=p_start or '2000-01-01',
            planned_end_date=p_end or '2000-01-01',
            actual_start_date=a_start or None,
            actual_end_date=a_end or None,
            status=status,
            is_valid=is_valid,
            validation_error=", ".join(err) if err else None
        ))
        
    return {
        "total_records": total,
        "valid_records": valid,
        "invalid_records": invalid,
        "duplicate_records": duplicate,
        "rows": rows
    }

@router.get("/template")
async def get_template(current_user = Depends(require_admin)):
    df = pd.DataFrame({
        "production_code": ["HIST-PRD-001"],
        "order_id": [1],
        "department": ["Assembly"],
        "target_quantity": [500],
        "completed_quantity": [500],
        "planned_start_date": ["2026-01-01"],
        "planned_end_date": ["2026-01-05"],
        "actual_start_date": ["2026-01-01"],
        "actual_end_date": ["2026-01-04"],
        "status": ["Completed"]
    })
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=texflow_historical_production_template.xlsx"}
    )

@router.post("/preview-file", response_model=ImportPreviewResponse)
async def preview_file(file: UploadFile = File(...), db: Session = Depends(get_db), current_user = Depends(require_admin)):
    content = await file.read()
    filename = file.filename.lower()
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content), dtype=str)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
        return process_dataframe(df, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

@router.post("/preview-url", response_model=ImportPreviewResponse)
def preview_url(req: GoogleSheetImportRequest, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    try:
        url = req.url
        if "docs.google.com/spreadsheets" in url:
            sheet_id_match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
            if sheet_id_match:
                sheet_id = sheet_id_match.group(1)
                csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
                df = pd.read_csv(csv_url, dtype=str)
                return process_dataframe(df, db)
            else:
                raise HTTPException(status_code=400, detail="Invalid Google Sheets URL format")
        else:
            raise HTTPException(status_code=400, detail="Not a valid Google Sheets URL")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Unable to access this Google Sheet. Make sure sharing is set to 'Anyone with the link can view'.")

@router.post("/confirm")
def confirm_import(req: ConfirmImportRequest, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    imported = 0
    for row in req.rows:
        if not row.is_valid:
            continue
            
        try:
            prod = Production(
                production_code=row.production_code,
                order_id=row.order_id,
                department=row.department,
                target_quantity=row.target_quantity,
                completed_quantity=row.completed_quantity,
                remaining_quantity=row.target_quantity - row.completed_quantity if row.target_quantity > row.completed_quantity else 0,
                planned_start_date=row.planned_start_date,
                planned_end_date=row.planned_end_date,
                actual_start_date=row.actual_start_date,
                actual_end_date=row.actual_end_date,
                status=row.status,
                progress_percentage=100.0 if row.status == 'Completed' else 0.0
            )
            db.add(prod)
            db.commit()
            imported += 1
        except Exception as e:
            db.rollback()
            # Ignore individual row insert errors to continue importing valid ones
            pass
            
    return {"status": "success", "imported": imported}

