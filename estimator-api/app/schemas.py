# app/schemas.py
from typing import Dict, List
from pydantic import BaseModel

# ----- Single prediction -----
# The frontend sends: { "features": { ... } }
class PredictSingleRequest(BaseModel):
    features: Dict[str, float]


# ----- Batch prediction -----
# If needed: { "instances": [ { ... }, { ... } ] }
class PredictBatchRequest(BaseModel):
    instances: List[Dict[str, float]]


# ----- Response shape from Project 1 -----
# Project 1 returns: { "predictions": [ ... ] }
class PredictResponse(BaseModel):
    predictions: List[float]
