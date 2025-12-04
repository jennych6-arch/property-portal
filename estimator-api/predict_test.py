# predict_test.py
"""Run batch predictions on Test Data For Prediction.csv and write predictions_for_test.csv"""
import pandas as pd
from pathlib import Path
import joblib
import json

TEST_PATH = Path("Test Data For Prediction.csv")
MODEL_PATH = Path("model.joblib")
METADATA_PATH = Path("model_metadata.json")
OUT_PATH = Path("predictions_for_test.csv")

if not MODEL_PATH.exists() or not METADATA_PATH.exists():
    raise SystemExit("Please run train.py first to create model.joblib and model_metadata.json")

model = joblib.load(MODEL_PATH)
meta = json.loads(open(METADATA_PATH).read())
features = meta.get("features")

df = pd.read_csv(TEST_PATH)
# Ensure columns order
df = df[features]
preds = model.predict(df)
df_out = df.copy()
df_out["predicted_price"] = preds
df_out.to_csv(OUT_PATH, index=False)
print("Wrote predictions to", OUT_PATH)
