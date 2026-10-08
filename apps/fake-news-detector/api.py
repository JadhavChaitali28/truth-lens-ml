"""
FastAPI REST API for the Fake News Detection System.
Provides endpoints for real-time article verification and model benchmarking metrics.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dataset.loader import load_dataset
from src.pipeline import FakeNewsDetectorSystem

app = FastAPI(
    title="Citadel Fake News Detection API",
    description="ML-powered news article veracity classification using TF-IDF and stylometric features",
    version="1.0.0",
)

ARTIFACTS_DIR = BASE_DIR / "artifacts"
detector_system = FakeNewsDetectorSystem()


@app.on_event("startup")
def startup_event():
    global detector_system
    if ARTIFACTS_DIR.exists() and (ARTIFACTS_DIR / "metadata.json").exists():
        detector_system.load(ARTIFACTS_DIR)
    else:
        # Train on-the-fly if artifacts are missing
        X_train, X_test, y_train, y_test = load_dataset()
        detector_system.train_and_compare(X_train, y_train, X_test, y_test)
        detector_system.save(ARTIFACTS_DIR)


class PredictionRequest(BaseModel):
    title: Optional[str] = Field(None, description="Headline or title of the news article")
    body: Optional[str] = Field(None, description="Body text or paragraphs of the news article")
    text: Optional[str] = Field(None, description="Combined text (fallback)")
    model_name: Optional[str] = Field(None, description="Optional specific model engine to use")


class PredictionResponse(BaseModel):
    veracity: str
    prediction_label: int
    confidence: float
    probabilities: Dict[str, float]
    model_used: str
    suspicious_stylistic_flags: List[str]
    linguistic_metrics: Dict[str, float]
    title_metrics: Optional[Dict[str, float]] = None
    body_metrics: Optional[Dict[str, float]] = None


@app.get("/health")
def health_check():
    return {"status": "ok", "champion_model": detector_system.champion_name}


@app.get("/api/v1/models")
def get_models():
    """Retrieve benchmark performance metrics for trained models."""
    return {
        "champion_model": detector_system.champion_name,
        "benchmarks": detector_system.benchmark_results,
    }


@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_article(request: PredictionRequest):
    """Predict whether a given news article is genuine or fake."""
    try:
        result = detector_system.predict_article(
            title=request.title,
            body=request.body,
            text=request.text,
            model_name=request.model_name,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
