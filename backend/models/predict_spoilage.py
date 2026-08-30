import sys
import json
import joblib
import pandas as pd
import os
import base64

def predict():
    try:
        # Decode the Base64 string passed from Node.js
        raw_b64 = sys.argv[1]
        decoded_str = base64.b64decode(raw_b64).decode('utf-8')
        input_data = json.loads(decoded_str)
        
        # Determine the directory of the current script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'spoilage_rf_model.pkl')
        
        # Load model
        model = joblib.load(model_path)
        
        # Create DataFrame from input data
        df = pd.DataFrame([input_data])
        
        # Predict probability of spoilage (class 1)
        proba = model.predict_proba(df)[0][1]
        
        # Determine risk category
        if proba > 0.8:
            category = "critical"
        elif proba > 0.5:
            category = "high"
        elif proba > 0.2:
            category = "medium"
        else:
            category = "low"
            
        result = {
            "probability": float(proba),
            "risk_category": category,
            "version": "v1.0-rf-tabular-hybrid"
        }
        
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    predict()