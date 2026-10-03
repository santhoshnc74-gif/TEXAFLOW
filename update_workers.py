import sys

with open('backend/app/api/workers.py', 'r') as f:
    content = f.read()

new_imports = '''import pandas as pd
import io
import math
import re
from fastapi import UploadFile, File
from pydantic import BaseModel
from typing import Any, Dict
from app.security.security import require_admin
'''

new_code = '''
class ImportPreviewResponse(BaseModel):
    total: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    rows: List[Dict[str, Any]]

class GoogleSheetImportRequest(BaseModel):
    url: str

def clean_value(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, float):
        if math.isnan(val):
            return None
        if val.is_integer():
            return str(int(val)).strip()
    return str(val).strip()

def process_dataframe(df: pd.DataFrame, db: Session):
    rows = []
    seen_ids = set()
    
    existing_workers = db.query(Worker.employee_id).all()
    existing_ids = {w[0] for w in existing_workers}
    
    col_mapping = {}
    for col in df.columns:
        clean_col = str(col).lower().strip().replace(' ', '_')
        col_mapping[col] = clean_col
    df = df.rename(columns=col_mapping)
    
    for idx, row in df.iterrows():
        emp_id = clean_value(row.get('employee_id')) or clean_value(row.get('employeeid')) or clean_value(row.get('id'))
        
        status = "Invalid"
        validation_errors = []
        
        if not emp_id:
            validation_errors.append("Employee ID is required")
        
        if emp_id:
            if emp_id in seen_ids:
                status = "Duplicate"
                validation_errors.append("Duplicate in file")
            elif emp_id in existing_ids:
                status = "Duplicate"
                validation_errors.append("Already in database")
            seen_ids.add(emp_id)
            
        name = clean_value(row.get('name'))
        if not name:
            validation_errors.append("Name is required")
            
        department = clean_value(row.get('department')) or clean_value(row.get('dept'))
        if not department:
            validation_errors.append("Department is required")
            
        email = clean_value(row.get('email'))
        phone = clean_value(row.get('phone'))
        designation = clean_value(row.get('designation'))
        shift = clean_value(row.get('shift'))
        worker_status = clean_value(row.get('status')) or "Active"
        
        if email and "@" not in email:
            validation_errors.append("Invalid email format")
            
        if validation_errors and status != "Duplicate":
            status = "Invalid"
        elif not validation_errors and status != "Duplicate":
            status = "Valid"
            
        rows.append({
            "employee_id": emp_id,
            "name": name,
            "department": department,
            "designation": designation,
            "phone": phone,
            "email": email,
            "shift": shift,
            "status": worker_status,
            "validation_status": status,
            "validation_errors": validation_errors
        })
        
    return {
        "total": len(rows),
        "valid_count": sum(1 for r in rows if r['validation_status'] == 'Valid'),
        "invalid_count": sum(1 for r in rows if r['validation_status'] == 'Invalid'),
        "duplicate_count": sum(1 for r in rows if r['validation_status'] == 'Duplicate'),
        "rows": rows
    }

@router.post("/import/preview-file", response_model=ImportPreviewResponse)
async def preview_workers_file(file: UploadFile = File(...), db: Session = Depends(get_db), current_user = Depends(require_admin)):
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

@router.post("/import/preview-url", response_model=ImportPreviewResponse)
def preview_workers_url(req: GoogleSheetImportRequest, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    try:
        url = req.url
        if "docs.google.com/spreadsheets" in url:
            sheet_id_match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
            if sheet_id_match:
                sheet_id = sheet_id_match.group(1)
                csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
                df = pd.read_csv(csv_url, dtype=str)
                return process_dataframe(df, db)
        raise HTTPException(status_code=400, detail="Invalid Google Sheets URL")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading Google Sheet: {str(e)}")

@router.post("/import/confirm")
def confirm_import(workers: List[WorkerCreate], db: Session = Depends(get_db), current_user = Depends(require_admin)):
    imported_count = 0
    try:
        for worker in workers:
            existing = db.query(Worker).filter(Worker.employee_id == worker.employee_id).first()
            if not existing:
                new_worker = Worker(**worker.model_dump())
                db.add(new_worker)
                imported_count += 1
        db.commit()
        return {"message": "Import successful", "imported_count": imported_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during import: {str(e)}")
'''

# Add imports at top
content = content.replace('from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse', 
                          'from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse\n' + new_imports)

# Add routes at bottom
content = content + '\n' + new_code

with open('backend/app/api/workers.py', 'w') as f:
    f.write(content)
