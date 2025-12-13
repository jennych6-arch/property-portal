# app/schemas.py (or schemas.py at project root, depending on your layout)

from typing import List, Dict
from pydantic import BaseModel


class PredictSingleRequest(BaseModel):
    """
    Request for a single prediction to the ML service (Task 1).

    Example:
    {
        "features": {
            "square_footage": 1500,
            "bedrooms": 3,
            ...
        }
    }
    """
    features: Dict[str, float]


class PredictBatchRequest(BaseModel):
    """
    Batch prediction request to the ML service (Task 1).

    Example:
    {
        "instances": [
            { "square_footage": 1500, "bedrooms": 3, ... },
            { "square_footage": 2000, "bedrooms": 4, ... }
        ]
    }
    """
    instances: List[Dict[str, float]]


class PredictResponse(BaseModel):
    """
    Raw ML service response: a list of predictions, one per instance.
    Used by both Task 1 ML API and Task 2 estimator backend.
    """
    predictions: List[float]


class EstimatorSingleResponse(BaseModel):
    """
    UI-facing response used by the Task 2 Estimator backend.

    The backend will call the ML /predict endpoint (which returns
    PredictResponse with a list of predictions), then unwrap the first
    element and return it as a single 'prediction' value.

    Example:
    {
        "prediction": 542123.45
    }
    """
    prediction: float
