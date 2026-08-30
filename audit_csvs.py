import pandas as pd
import json
import glob
import os

def audit_csvs():
    csv_files = glob.glob('*.csv')
    report = []
    for file in csv_files:
        df = pd.read_csv(file)
        
        info = {
            "Filename": file,
            "Total Rows": len(df),
            "Total Columns": len(df.columns),
            "Duplicate Rows": int(df.duplicated().sum()),
            "Columns": {}
        }
        
        for col in df.columns:
            dtype = str(df[col].dtype)
            missing = int(df[col].isnull().sum())
            unique_count = int(df[col].nunique())
            
            col_type = "Categorical"
            if "int" in dtype or "float" in dtype:
                col_type = "Numerical"
            if "datetime" in dtype or "date" in col.lower() or "timestamp" in col.lower() or "time" in col.lower():
                col_type = "Timestamp/Date"
                
            info["Columns"][col] = {
                "DataType": dtype,
                "Missing Values": missing,
                "Unique Values": unique_count,
                "Type": col_type
            }
            
        report.append(info)
        
    with open('audit_details.json', 'w') as f:
        json.dump(report, f, indent=4)

if __name__ == "__main__":
    audit_csvs()
