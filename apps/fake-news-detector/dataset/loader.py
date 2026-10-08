"""
Dataset loader and normalization utilities for the Fake News Detection System.
Supports loading custom CSV/TSV datasets or the built-in benchmark dataset.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Tuple, Optional
import pandas as pd
from sklearn.model_selection import train_test_split


DEFAULT_DATASET_PATH = Path(__file__).parent / "sample_articles.csv"


def normalize_labels(series: pd.Series) -> pd.Series:
    """Normalize various label representations to binary integers: 1 (Fake), 0 (Genuine)."""
    mapping = {
        "fake": 1,
        "false": 1,
        "pants-fire": 1,
        "barely-true": 1,
        "unreliable": 1,
        "1": 1,
        1: 1,
        1.0: 1,
        "true": 0,
        "real": 0,
        "genuine": 0,
        "mostly-true": 0,
        "half-true": 0,
        "reliable": 0,
        "0": 0,
        0: 0,
        0.0: 0,
    }
    
    # Lowercase strings if needed
    cleaned = series.apply(lambda x: str(x).strip().lower() if isinstance(x, str) else x)
    return cleaned.map(mapping).fillna(1).astype(int)


def load_dataset(
    filepath: Optional[str | Path] = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """
    Load and preprocess dataset, returning train/test splits.

    Returns:
        X_train, X_test, y_train, y_test (pandas Series)
    """
    target_path = Path(filepath) if filepath else DEFAULT_DATASET_PATH
    if not target_path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {target_path}")

    df = pd.read_csv(target_path)

    # Detect text column
    text_col = None
    for candidate in ["text", "content", "statement", "article", "body", "news"]:
        if candidate in df.columns:
            text_col = candidate
            break

    title_col = "title" if "title" in df.columns else None

    if text_col is None and title_col is not None:
        text_col = title_col
        title_col = None

    if text_col is None:
        raise ValueError(f"Could not identify a text column in CSV columns: {list(df.columns)}")

    # Detect label column
    label_col = None
    for candidate in ["label", "class", "target", "veracity", "is_fake"]:
        if candidate in df.columns:
            label_col = candidate
            break

    if label_col is None:
        raise ValueError(f"Could not identify a label column in CSV columns: {list(df.columns)}")

    # Combine title and text if title is present for richest representation
    if title_col and title_col != text_col:
        combined_text = df[title_col].fillna("") + " " + df[text_col].fillna("")
    else:
        combined_text = df[text_col].fillna("")

    labels = normalize_labels(df[label_col])

    # Filter out empty texts
    valid_mask = combined_text.str.strip().str.len() > 10
    combined_text = combined_text[valid_mask].reset_index(drop=True)
    labels = labels[valid_mask].reset_index(drop=True)

    X_train, X_test, y_train, y_test = train_test_split(
        combined_text,
        labels,
        test_size=test_size,
        random_state=random_state,
        stratify=labels,
    )

    return X_train, X_test, y_train, y_test
