# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import os
import requests

app = FastAPI(title="Project 2 Estimator API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# IMPORTANT:
# Project 1 container is running as:
#     docker run -p 8000:80 housing-price-api
# So the ML API is accessible at:
#     http://localhost:8000
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


@app.post("/predict", summary="Predict price (single or batch)")
def predict(payload: Dict):
    """
    Project 2 UI sends:
      { "features": { ... } }  → SINGLE prediction
    Batch requests come as:
      { "instances": [ {..}, {..} ] }

    Project 1 only supports:
      { "instances": [ ... ] }

    So convert single → batch before forwarding.
    """

    # ---- SINGLE ----
    if "features" in payload:
        instance = payload["features"]
        converted = {"instances": [instance]}

    # ---- BATCH ----
    elif "instances" in payload:
        converted = payload

    else:
        raise HTTPException(
            status_code=400,
            detail="Payload must contain 'features' (single) or 'instances' (batch)."
        )

    # Forward to Project 1 container
    try:
        r = requests.post(
            f"{ML_API_BASE_URL}/predict",
            json=converted,
            timeout=5
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cannot reach ML API: {str(e)}")

    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    result = r.json()

    # If original request was SINGLE → unwrap predictions[0]
    if "features" in payload:
        preds = result.get("predictions", [])
        if preds:
            return {"prediction": preds[0]}
        else:
            raise HTTPException(status_code=500, detail="ML API returned no predictions.")

    # Batch → return all predictions
    return result
