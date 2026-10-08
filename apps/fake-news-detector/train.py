#!/usr/bin/env python3
"""
CLI training runner for the Fake News Detection System.
Trains SVM, Random Forest, and XGBoost models, reports benchmark performance,
and serializes artifacts.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure package directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dataset.loader import load_dataset
from src.pipeline import FakeNewsDetectorSystem


def main():
    parser = argparse.ArgumentParser(
        description="Train and benchmark ML models for Fake News Detection"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=None,
        help="Path to CSV dataset (defaults to built-in sample_articles.csv)",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.25,
        help="Fraction of dataset reserved for testing/evaluation (default: 0.25)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(BASE_DIR / "artifacts"),
        help="Directory to save trained models and metadata",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("      CITADEL FAKE NEWS DETECTION SYSTEM — MODEL TRAINING      ")
    print("=" * 70)

    # 1. Load Data
    print(f"\n[1/4] Loading dataset from: {args.dataset or 'default benchmark dataset'}...")
    X_train, X_test, y_train, y_test = load_dataset(
        filepath=args.dataset,
        test_size=args.test_size,
    )
    print(f"      Total Training Samples: {len(X_train)} (Fake: {sum(y_train)}, Genuine: {len(y_train)-sum(y_train)})")
    print(f"      Total Testing Samples:  {len(X_test)} (Fake: {sum(y_test)}, Genuine: {len(y_test)-sum(y_test)})")

    # 2. Train Models
    print("\n[2/4] Training candidate models (SVM, Random Forest, XGBoost)...")
    system = FakeNewsDetectorSystem()
    results = system.train_and_compare(X_train, y_train, X_test, y_test)

    # 3. Benchmark Report
    print("\n[3/4] Model Evaluation Benchmark Table:")
    print("-" * 70)
    print(results["markdown_table"])
    print("-" * 70)
    print(f"[*] Champion Model Selected: {results['champion']}")

    # 4. Save Artifacts
    print(f"\n[4/4] Saving model artifacts to: {args.output_dir}...")
    system.save(args.output_dir)
    print("      Artifacts saved successfully!")

    # 5. Quick Sanity Demonstration
    print("\n" + "=" * 70)
    print("      SANITY CHECK DEMONSTRATION")
    print("=" * 70)

    sample_fake = (
        "SHOCKING CONSPIRACY: Secret alien transmission decoded by whistleblowers proves "
        "world governments are hiding free energy generators! SHARE BEFORE DELETED!!!"
    )
    sample_real = (
        "The International Monetary Fund published its latest World Economic Outlook on "
        "Tuesday, projecting global gross domestic product growth to stabilize at 3.2 percent."
    )

    pred_fake = system.predict_article(sample_fake)
    print(f"\nInput: \"{sample_fake[:60]}...\"")
    print(f"Result: {pred_fake['veracity']} (Confidence: {pred_fake['confidence']*100:.1f}%)")
    if pred_fake['suspicious_stylistic_flags']:
        print(f"Flags:  {', '.join(pred_fake['suspicious_stylistic_flags'])}")

    pred_real = system.predict_article(sample_real)
    print(f"\nInput: \"{sample_real[:60]}...\"")
    print(f"Result: {pred_real['veracity']} (Confidence: {pred_real['confidence']*100:.1f}%)")

    print("\nTraining run complete!")


if __name__ == "__main__":
    main()
