import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import os
import json

def train_and_evaluate():
    print("Loading data...")
    # Load the training data (navigate from backend/models/ to root)
    df = pd.read_csv('../../delay_training_ready.csv')
    
    # Target variable
    y = df['delayed']
    
    # Features selected based on phase 1 audit
    # Dropping columns with massive missing values (>80%)
    features_to_drop = ['shipment_id', 'assigned_vehicle_id', 'assigned_route_id', 'assigned_vehicle_type', 
                        'vehicle_capacity_kg', 'vehicle_temp_min_c', 'vehicle_temp_max_c', 
                        'vehicle_reliability_feature', 'vehicle_temperature_control_score',
                        'historical_handling_time_hours', 'historical_congestion_level', 
                        'historical_weather_condition', 'historical_peak_period', 
                        'route_weather_sensitivity', 'route_temperature_stability', 
                        'route_avg_transit_hr', 'route_base_cost_inr', 'route_typical_transfer_count']
                        
    X = df.drop(columns=features_to_drop + ['delayed'])
    
    # Define feature types for preprocessing
    categorical_features = ['product_type', 'transport_mode']
    numeric_features = [col for col in X.columns if col not in categorical_features]
    
    print(f"Dataset Size: {len(df)} rows")
    print(f"Features: {X.columns.tolist()}")

    # Preprocessing pipelines
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median'))
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Full Pipeline
    rf_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced', max_depth=10))])
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("Training model...")
    rf_pipeline.fit(X_train, y_train)
    
    # Evaluate
    print("Evaluating model...")
    y_pred = rf_pipeline.predict(X_test)
    y_proba = rf_pipeline.predict_proba(X_test)[:, 1]
    
    report = classification_report(y_test, y_pred, output_dict=True)
    roc_auc = roc_auc_score(y_test, y_proba)
    conf_matrix = confusion_matrix(y_test, y_pred).tolist()
    
    print(f"ROC-AUC: {roc_auc:.4f}")
    print("Confusion Matrix:")
    print(conf_matrix)
    
    metrics = {
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "roc_auc": roc_auc,
        "classification_report": report,
        "confusion_matrix": conf_matrix,
        "features": X.columns.tolist()
    }
    
    os.makedirs('output', exist_ok=True)
    with open('output/metrics.json', 'w') as f:
        json.dump(metrics, f, indent=4)
        
    print("Saving model...")
    joblib.dump(rf_pipeline, 'delay_rf_model.pkl')
    print("Model saved to delay_rf_model.pkl")

if __name__ == "__main__":
    train_and_evaluate()
