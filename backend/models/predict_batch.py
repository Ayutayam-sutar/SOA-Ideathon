import sys
import json
import joblib
import pandas as pd
import os
import base64

def predict_batch():
    try:
        # Decode the Base64 string passed from Node.js
        raw_b64 = sys.argv[1]
        decoded_str = base64.b64decode(raw_b64).decode('utf-8')
        input_data = json.loads(decoded_str)
        
        if not input_data:
            print(json.dumps([]))
            sys.exit(0)
            
        script_dir = os.path.dirname(os.path.abspath(__file__))
        spoilage_model_path = os.path.join(script_dir, 'spoilage_rf_model.pkl')
        delay_model_path = os.path.join(script_dir, 'delay_rf_model.pkl')
        
        # Load models ONCE into RAM
        spoilage_model = joblib.load(spoilage_model_path)
        delay_model = joblib.load(delay_model_path)
        
        # Extract features for all candidates
        spoilage_list = [item["spoilageFeatures"] for item in input_data]
        delay_list = [item["delayFeatures"] for item in input_data]
        
        spoilage_df = pd.DataFrame(spoilage_list)
        delay_df = pd.DataFrame(delay_list)
        
        # Vectorized predictions (Evaluates all 3 routes simultaneously)
        spoilage_probs = spoilage_model.predict_proba(spoilage_df)[:, 1]
        delay_probs = delay_model.predict_proba(delay_df)[:, 1]
        
        def get_category(proba):
            if proba > 0.8: return "critical"
            elif proba > 0.5: return "high"
            elif proba > 0.2: return "medium"
            else: return "low"
        
        results = []
        for i in range(len(input_data)):
            s_prob = float(spoilage_probs[i])
            d_prob = float(delay_probs[i])
            
            results.append({
                "id": input_data[i]["id"],
                "spoilage": {
                    "probability": s_prob,
                    "risk_category": get_category(s_prob)
                },
                "delay": {
                    "probability": d_prob,
                    "risk_category": get_category(d_prob)
                }
            })
            
        print(json.dumps(results))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    predict_batch()