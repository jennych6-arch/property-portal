# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import requests

from .schemas import (
    PredictSingleRequest,
    PredictResponse,
    EstimatorSingleResponse,
)

app = FastAPI(title="Project 2 Estimator API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base URL of the Task 1 ML API (Docker container)
# Override this via environment variable in different environments
ML_API_BASE_URL = os.getenv("ML_API_BASE_URL", "http://localhost:8000")


@app.get("/health", summary="Health check")
def health():
    """Checks if Project 2 backend is running AND if Project 1 container is reachable."""
    try:
        r = requests.get(f"{ML_API_BASE_URL}/health", timeout=3)
        r.raise_for_status()
        return {"status": "ok", "ml_api": r.json()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ML API unavailable: {str(e)}")  # type: ignore


@app.get("/model-info", summary="Model info")
def model_info():
    """Returns metadata from Project 1 container."""
    try:
        r = requests.get(f"{ML_API_BASE_URL}/model-info", timeout=3)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error contacting ML API: {str(e)}")  # type: ignore


@app.post("/predict", response_model=EstimatorSingleResponse)
def predict_single(request: PredictSingleRequest):
    """
    Estimator backend entrypoint used by the Task 2 Estimator UI.

    - Accepts a *single* property:
        { "features": { "square_footage": ..., "bedrooms": ..., ... } }

    - Forwards this to the Task 1 ML /predict endpoint, which returns:
        { "predictions": [<float>, ...] }

    - Validates the ML response and unwraps the first element:
        { "prediction": <float> }
    """
    # data validation
    if not request.features:
        raise HTTPException(status_code=400, detail="Features cannot be empty.")

    for name, value in request.features.items():
        if value is None or not isinstance(value, (int, float)):
            raise HTTPException(status_code=400, detail=f"Invalid value for {name}")
        if not (0 < value < 1e7):  # example sanity range
            raise HTTPException(status_code=400, detail=f"Unreasonable value for {name}: {value}")

    # Forward the request body to Task 1 ML API
    try:
        r = requests.post(
            f"{ML_API_BASE_URL}/predict",
            json=request.dict(),
            timeout=5,
        )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"ML API unreachable: {e}",
        )

    if r.status_code != 200:
        # Treat non-200 from ML API as upstream failure
        raise HTTPException(status_code=502, detail=r.text)

    # Validate and parse ML API response using PredictResponse schema
    try:
        ml_resp = PredictResponse.parse_obj(r.json())
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid response from ML API: {e}",
        )

    if not ml_resp.predictions:
        raise HTTPException(
            status_code=500,
            detail="ML API returned no predictions.",
        )

    # Unwrap the first prediction for the UI
    return EstimatorSingleResponse(prediction=ml_resp.predictions[0])