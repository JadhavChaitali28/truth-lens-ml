#!/usr/bin/env python3
"""
CLI inference script for the Fake News Detection System.
Accepts article text via flag or prompt, returns prediction & linguistic diagnosis.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dataset.loader import load_dataset
from src.pipeline import FakeNewsDetectorSystem


def get_or_train_system(artifacts_dir: Path) -> FakeNewsDetectorSystem:
    system = FakeNewsDetectorSystem()
    if artifacts_dir.exists() and (artifacts_dir / "metadata.json").exists():
        system.load(artifacts_dir)
    else:
        print("Note: No pre-trained artifacts found. Training default benchmark pipeline...")
        X_train, X_test, y_train, y_test = load_dataset()
        system.train_and_compare(X_train, y_train, X_test, y_test)
        system.save(artifacts_dir)
    return system


def main():
    parser = argparse.ArgumentParser(description="Predict whether a news article is fake or genuine")
    parser.add_argument("--title", type=str, default=None, help="Article headline / title")
    parser.add_argument("--body", type=str, default=None, help="Article content / body text")
    parser.add_argument("--text", type=str, default=None, help="Full news article text (fallback)")
    parser.add_argument("--file", type=str, default=None, help="Path to text file containing article")
    parser.add_argument(
        "--artifacts-dir",
        type=str,
        default=str(BASE_DIR / "artifacts"),
        help="Path to trained model artifacts directory",
    )
    args = parser.parse_args()

    artifacts_path = Path(args.artifacts_dir)
    system = get_or_train_system(artifacts_path)

    # Determine input text
    input_title = args.title
    input_body = args.body or args.text

    if not input_title and not input_body:
        if args.file:
            file_path = Path(args.file)
            if not file_path.exists():
                print(f"Error: File '{file_path}' does not exist.")
                sys.exit(1)
            input_body = file_path.read_text(encoding="utf-8")
        else:
            print("Enter article headline (or leave empty):")
            input_title = input().strip()
            print("Enter article body text below (press Enter twice to analyze):")
            lines = []
            while True:
                try:
                    line = input()
                    if not line and lines:
                        break
                    lines.append(line)
                except EOFError:
                    break
            input_body = "\n".join(lines).strip()

    if not input_title and not input_body:
        print("Error: No title or text provided.")
        sys.exit(1)

    result = system.predict_article(title=input_title, body=input_body)

    print("\n" + "=" * 65)
    print("                VERACITY ANALYSIS REPORT                 ")
    print("=" * 65)
    conf_pct = result["confidence"] * 100
    if conf_pct < 60.0:
        verdict_str = "🟡 UNCERTAIN"
    elif result["prediction_label"] == 1:
        verdict_str = "🔴 LIKELY FAKE"
    else:
        verdict_str = "🟢 LIKELY REAL"

    print(f"Prediction:       {verdict_str}")
    print(f"Confidence:       {conf_pct:.0f}%")
    print(f"Model Engine:     {result['model_used']}")
    print(f"Probability Real: {result['probabilities']['genuine']*100:.1f}%")
    print(f"Probability Fake: {result['probabilities']['fake']*100:.1f}%")
    print("-" * 65)
    print("Why did the model make this prediction?")
    if result.get("explanation_indicators"):
        for indicator in result["explanation_indicators"]:
            print(f"• {indicator}")
    else:
        print("• Writing style resembles previously classified articles")
    print("-" * 65)
    print("Linguistic & Stylometric Indicators:")
    lm = result["linguistic_metrics"]
    print(f"  - ALL-CAPS Words:      {lm['all_caps_word_ratio']*100:.1f}%")
    print(f"  - Exclamation Density: {lm['exclamation_density']:.2f}%")
    print(f"  - Lexical Diversity:   {lm['lexical_diversity']:.3f} (unique words / total)")
    print(f"  - Sensationalist Cues: {int(lm['sensational_cue_count'])} keyword(s) detected")
    print(f"  - Avg Sentence Length: {lm['avg_sentence_length']:.1f} words")

    if result["suspicious_stylistic_flags"]:
        print("-" * 65)
        print("[!] Flagged Anomalies:")
        for flag in result["suspicious_stylistic_flags"]:
            print(f"  [!] {flag}")
    print("=" * 65)


if __name__ == "__main__":
    main()
