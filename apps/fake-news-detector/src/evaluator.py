"""
Evaluation metrics and benchmark reporting for Fake News Detection.
"""

from __future__ import annotations

from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)


def evaluate_predictions(
    y_true: Sequence[int],
    y_pred: Sequence[int],
    y_prob: Sequence[float] | None = None,
) -> Dict[str, Any]:
    """
    Compute comprehensive classification metrics.
    """
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1_bin = f1_score(y_true, y_pred, zero_division=0)
    f1_macro = f1_score(y_true, y_pred, average="macro", zero_division=0)

    roc_auc = None
    if y_prob is not None:
        try:
            # If probabilities are 2D, take positive class column
            if hasattr(y_prob, "ndim") and y_prob.ndim == 2:
                prob_pos = y_prob[:, 1]
            elif isinstance(y_prob, (list, tuple)) and isinstance(y_prob[0], (list, tuple)):
                prob_pos = [p[1] for p in y_prob]
            else:
                prob_pos = y_prob
            roc_auc = roc_auc_score(y_true, prob_pos)
        except Exception:
            roc_auc = None

    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)

    return {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1_bin),
        "f1_macro": float(f1_macro),
        "roc_auc": float(roc_auc) if roc_auc is not None else None,
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
    }


def format_benchmark_table(results: Dict[str, Dict[str, Any]]) -> str:
    """
    Format evaluation results for multiple models as an aligned Markdown table.
    """
    header = "| Model Name | Accuracy | Precision | Recall | F1 Score | F1 (Macro) | ROC-AUC |"
    separator = "| :--- | :---: | :---: | :---: | :---: | :---: | :---: |"
    rows = [header, separator]

    for model_name, metrics in results.items():
        acc_str = f"{metrics['accuracy']:.4f}"
        prec_str = f"{metrics['precision']:.4f}"
        rec_str = f"{metrics['recall']:.4f}"
        f1_str = f"{metrics['f1_score']:.4f}"
        f1_mac_str = f"{metrics['f1_macro']:.4f}"
        auc_str = f"{metrics['roc_auc']:.4f}" if metrics.get("roc_auc") is not None else "N/A"

        row = f"| {model_name} | {acc_str} | {prec_str} | {rec_str} | {f1_str} | {f1_mac_str} | {auc_str} |"
        rows.append(row)

    return "\n".join(rows)
