"""
Model definitions and factories for the Fake News Detection System.
Implements SVM, Random Forest, and XGBoost with consistent scikit-learn interfaces.
"""

from __future__ import annotations

import logging
from typing import Dict, Any
from sklearn.base import BaseEstimator
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

logger = logging.getLogger(__name__)

# Try importing XGBoost; provide graceful fallback to GradientBoostingClassifier if missing
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    logger.info("XGBoost package not installed. Using GradientBoostingClassifier as gradient boosting engine.")


def create_svm_model(C: float = 1.0, random_state: int = 42) -> BaseEstimator:
    """
    Support Vector Machine with probability calibration via Platt scaling.
    LinearSVC is exceptionally fast and accurate for high-dimensional sparse text vectors.
    """
    base_svc = LinearSVC(C=C, random_state=random_state, max_iter=3000, dual="auto")
    # Wrap in CalibratedClassifierCV to enable predict_proba
    return CalibratedClassifierCV(estimator=base_svc, cv=3)


def create_random_forest_model(
    n_estimators: int = 100,
    max_depth: int | None = 20,
    random_state: int = 42,
) -> BaseEstimator:
    """
    Random Forest ensemble classifier.
    Captures non-linear interactions across TF-IDF terms and stylometric features.
    """
    return RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        n_jobs=1,
    )


def create_xgboost_model(
    n_estimators: int = 80,
    learning_rate: float = 0.1,
    max_depth: int = 4,
    random_state: int = 42,
) -> BaseEstimator:
    """
    Gradient Boosted Trees classifier.
    Uses XGBoost when available, otherwise scikit-learn GradientBoostingClassifier.
    """
    if HAS_XGBOOST:
        return XGBClassifier(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=random_state,
            eval_metric="logloss",
            n_jobs=1,
        )
    else:
        return GradientBoostingClassifier(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=random_state,
        )


def get_available_models(random_state: int = 42) -> Dict[str, BaseEstimator]:
    """Returns a dictionary containing initialized candidate models."""
    return {
        "SVM (Linear + Calibrated)": create_svm_model(random_state=random_state),
        "Random Forest": create_random_forest_model(random_state=random_state),
        "XGBoost": create_xgboost_model(random_state=random_state),
    }
