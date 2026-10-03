import os
import json

path = 'backend/app/ai/model_training.py'
with open(path, 'r') as f:
    content = f.read()

replacement = '''def get_ai_status(db: Session = None):
    status_data = {
        "model_available": False,
        "prediction_mode": "rule_based"
    }
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, 'r') as f:
            status_data = json.load(f)
            
    if db:
        completed_count = db.query(Production).filter(Production.status == 'Completed').count()
        status_data['completed_records_count'] = completed_count
        
    return status_data'''

# Use regex or simple string replacement to replace the existing get_ai_status block
import re
content = re.sub(r'def get_ai_status\(db: Session = None\):.*?(?=\n\n|\Z)', replacement, content, flags=re.DOTALL)
# Fallback if it didn't match the new signature (in case the prev replacement failed)
content = re.sub(r'def get_ai_status\(\):.*?(?=\n\n|\Z)', replacement, content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)
