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

def generate_synthetic_label_and_train():
    print("Loading data...")
    # Navigate to root to load files
    base_dir = '../../'
    df_hist = pd.read_csv(os.path.join(base_dir, 'historical_shipments_clean.csv'))
    df_temp = pd.read_csv(os.path.join(base_dir, 'temperature_shipment_aggregates_AUDIT_ONLY.csv'))
    
    # Merge datasets
    df = pd.merge(df_hist, df_temp, on='shipment_id', how='inner')
    
    # Probabilistic Synthetic Label Generation
    print("Generating synthetic spoilage labels...")
    np.random.seed(42)
    
    # Cargo Vulnerability Multiplier
    def get_vulnerability(pt):
        pt_lower = str(pt).lower()
        if 'berries' in pt_lower or 'greens' in pt_lower or 'seafood' in pt_lower:
            return 1.5
        elif 'meat' in pt_lower or 'dairy' in pt_lower:
            return 1.2
        return 1.0

    df['vulnerability'] = df['product_type'].apply(get_vulnerability)
    
    # Logistic excursion risk (steep increase around 30 mins)
    df['excursion_risk'] = 1 / (1 + np.exp(-0.2 * (df['temperature_excursion_minutes'] - 30)))
    
    # Peak Delta Risk
    df['peak_delta'] = df['observed_max_temp'] - df['required_max_temp_c']
    df['peak_delta'] = df['peak_delta'].apply(lambda x: max(0, x))
    df['peak_delta_risk'] = df['peak_delta'] * 0.1 # 10% base risk per degree over max
    
    # Delay aging risk
    df['delay_risk'] = df['delay_minutes'] * 0.001
    
    # Base Probability P
    df['P_spoilage'] = (df['excursion_risk'] + df['peak_delta_risk']) * df['vulnerability'] + df['delay_risk']
    
    # Add Gaussian Noise
    noise = np.random.normal(0, 0.1, size=len(df))
    df['P_spoilage_noisy'] = df['P_spoilage'] + noise
    
    # Clip between 0.01 and 0.99
    df['P_spoilage_final'] = df['P_spoilage_noisy'].clip(0.01, 0.99)
    
    # Generate Boolean Target U(0,1) < P
    uniform_draws = np.random.uniform(0, 1, size=len(df))
    df['spoiled_synthetic'] = (uniform_draws < df['P_spoilage_final']).astype(int)
    
    print(f"Synthetic Target Distribution:\n{df['spoiled_synthetic'].value_counts(normalize=True)}")
    
    # Save the synthetic dataset explicitly
    output_csv = os.path.join(base_dir, 'historical_shipments_synthetic_spoilage.csv')
    df.to_csv(output_csv, index=False)
    print(f"Saved synthetic dataset to {output_csv}")
    
    # Model Training Phase
    # Select features based on User Prompt (In-Transit / Audit supported features)
    features = [
        'product_type', 'required_min_temp_c', 'required_max_temp_c',
        'observed_avg_temp', 'observed_max_temp', 'observed_min_temp',
        'temperature_excursion_minutes', 'observed_excursion_count',
        'base_transit_hr', 'delay_minutes', 'transfer_count', 'weight_kg'
    ]
    
    X = df[features]
    y = df['spoiled_synthetic']
    
    categorical_features = ['product_type']
    numeric_features = [col for col in X.columns if col not in categorical_features]
    
    print(f"Dataset Size: {len(df)} rows")
    print(f"Features used: {features}")

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
    
    rf_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced', max_depth=10))])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("Training Spoilage Model...")
    rf_pipeline.fit(X_train, y_train)
    
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
        "features": features,
        "label_source": "synthetic (transparent probabilistic generation)"
    }
    
    os.makedirs('output', exist_ok=True)
    with open('output/spoilage_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=4)
        
    print("Saving model...")
    joblib.dump(rf_pipeline, 'spoilage_rf_model.pkl')
    print("Model saved to spoilage_rf_model.pkl")

if __name__ == "__main__":
    generate_synthetic_label_and_train()
