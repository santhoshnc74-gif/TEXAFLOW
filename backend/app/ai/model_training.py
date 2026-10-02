import os
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.production import Production, ProductionUpdate
from app.models.order import Order
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_DURATION_PATH = os.path.join(MODELS_DIR, 'model_duration.joblib')
MODEL_DELAY_PATH = os.path.join(MODELS_DIR, 'model_delay.joblib')
METADATA_PATH = os.path.join(MODELS_DIR, 'metadata.json')

import json

def train_models(db: Session):
    # Fetch completed productions
    productions = db.query(Production).filter(Production.status == 'Completed').all()
    
    if len(productions) < 10:
        return {
            "status": "failed",
            "message": "Insufficient historical data for trained ML prediction. Need at least 10 completed records.",
            "records_found": len(productions)
        }
        
    data = []
    for p in productions:
        order = db.query(Order).filter(Order.id == p.order_id).first()
        if not order or not p.actual_start_date or not p.actual_end_date:
            continue
            
        actual_duration = (p.actual_end_date - p.actual_start_date).days
        delay_days = (p.actual_end_date - order.expected_delivery_date).days
        delay_class = 1 if delay_days > 0 else 0
        
        data.append({
            'target_quantity': p.target_quantity,
            'planned_duration': (p.planned_end_date - p.planned_start_date).days,
            'order_quantity': order.quantity,
            'priority_encoded': 1 if p.priority in ['High', 'Urgent'] else 0,
            
            # Targets
            'actual_duration_days': actual_duration,
            'delay_class': delay_class
        })
        
    df = pd.DataFrame(data)
    if len(df) < 10:
        return {
            "status": "failed",
            "message": "Insufficient valid completed historical data after cleaning.",
            "records_found": len(df)
        }
        
    # Features & Targets
    X = df[['target_quantity', 'planned_duration', 'order_quantity', 'priority_encoded']]
    y_duration = df['actual_duration_days']
    y_delay = df['delay_class']
    
    # Train Duration Model (Regression)
    X_train, X_test, y_train, y_test = train_test_split(X, y_duration, test_size=0.2, random_state=42)
    reg = RandomForestRegressor(n_estimators=50, random_state=42)
    reg.fit(X_train, y_train)
    duration_mae = mean_absolute_error(y_test, reg.predict(X_test))
    
    # Train Delay Model (Classification)
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X, y_delay, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train_c, y_train_c)
    delay_accuracy = accuracy_score(y_test_c, clf.predict(X_test_c))
    
    # Save models
    joblib.dump(reg, MODEL_DURATION_PATH)
    joblib.dump(clf, MODEL_DELAY_PATH)
    
    # Save metadata
    metadata = {
        "model_available": True,
        "prediction_mode": "ml",
        "model_version": "1.0",
        "trained_at": datetime.now().isoformat(),
        "training_records": len(df),
        "evaluation_metrics": {
            "duration_mae": duration_mae,
            "delay_accuracy": delay_accuracy
        }
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f)
        
    return {
        "status": "success",
        "message": "Models trained successfully.",
        "metadata": metadata
    }

def get_ai_status():
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, 'r') as f:
            return json.load(f)
    return {
        "model_available": False,
        "prediction_mode": "rule_based"
    }
