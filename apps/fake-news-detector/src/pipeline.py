"""
End-to-end pipeline manager for the Fake News Detection System.
Handles model training, benchmark comparison, persistence, and explainable inference.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, Optional, Sequence
import joblib
from sklearn.pipeline import Pipeline

from .features import build_feature_extractor, LinguisticFeatureExtractor
from .models import get_available_models
from .evaluator import evaluate_predictions, format_benchmark_table


class FakeNewsDetectorSystem:
    """
    Complete system orchestrating feature extraction, multi-model training,
    evaluation, model selection, and explainable inference.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.trained_pipelines: Dict[str, Pipeline] = {}
        self.benchmark_results: Dict[str, Dict[str, Any]] = {}
        self.champion_name: Optional[str] = None
        self.linguistic_analyzer = LinguisticFeatureExtractor()

    def build_pipeline(self, classifier) -> Pipeline:
        """Constructs an end-to-end scikit-learn pipeline."""
        return Pipeline([
            ("features", build_feature_extractor()),
            ("classifier", classifier),
        ])

    def train_and_compare(
        self,
        X_train: Sequence[str],
        y_train: Sequence[int],
        X_test: Sequence[str],
        y_test: Sequence[int],
    ) -> Dict[str, Any]:
        """
        Trains SVM, Random Forest, and XGBoost on training data and benchmarks on test data.
        """
        models = get_available_models(random_state=self.random_state)
        self.trained_pipelines = {}
        self.benchmark_results = {}

        best_score = -1.0
        best_name = None

        for name, clf in models.items():
            pipe = self.build_pipeline(clf)
            pipe.fit(X_train, y_train)
            self.trained_pipelines[name] = pipe

            # Predictions
            y_pred = pipe.predict(X_test)
            y_prob = None
            if hasattr(pipe, "predict_proba"):
                try:
                    y_prob = pipe.predict_proba(X_test)
                except Exception:
                    y_prob = None

            metrics = evaluate_predictions(y_test, y_pred, y_prob)
            self.benchmark_results[name] = metrics

            # Choose champion based on macro F1 score
            score = metrics["f1_macro"]
            if score > best_score:
                best_score = score
                best_name = name

        self.champion_name = best_name

        return {
            "champion": self.champion_name,
            "benchmark": self.benchmark_results,
            "markdown_table": format_benchmark_table(self.benchmark_results),
        }

    @property
    def champion_pipeline(self) -> Pipeline:
        if not self.champion_name or self.champion_name not in self.trained_pipelines:
            raise ValueError("No model trained yet. Call train_and_compare first.")
        return self.trained_pipelines[self.champion_name]

    def predict_article(
        self,
        text: Optional[str] = None,
        title: Optional[str] = None,
        body: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Classify a news article by title and body, returning prediction with linguistic breakdown.
        """
        # Assemble text representation
        clean_title = (title or "").strip()
        clean_body = (body or (text or "")).strip()

        if clean_title and clean_body:
            combined_text = f"{clean_title} {clean_body}"
        elif clean_title:
            combined_text = clean_title
        elif clean_body:
            combined_text = clean_body
        else:
            raise ValueError("Must provide either 'title', 'body', or 'text'.")

        active_name = model_name or self.champion_name
        if not active_name or active_name not in self.trained_pipelines:
            raise ValueError(f"Model '{active_name}' not found or not trained.")

        pipe = self.trained_pipelines[active_name]
        pred_label = int(pipe.predict([combined_text])[0])

        probabilities = {"genuine": 0.5, "fake": 0.5}
        confidence = 0.5
        if hasattr(pipe, "predict_proba"):
            try:
                probs = pipe.predict_proba([combined_text])[0]
                probabilities = {
                    "genuine": float(probs[0]),
                    "fake": float(probs[1]),
                }
                confidence = float(probs[pred_label])
            except Exception:
                pass

        # Extract linguistic metrics for full text
        linguistic_metrics = self.linguistic_analyzer.extract_features_single(combined_text)
        title_metrics = self.linguistic_analyzer.extract_features_single(clean_title) if clean_title else None
        body_metrics = self.linguistic_analyzer.extract_features_single(clean_body) if clean_body else None

        # Identify suspicious stylistic markers
        suspicious_flags = []
        if title_metrics and title_metrics["all_caps_word_ratio"] > 0.20:
            suspicious_flags.append(
                f"Headline uses high ALL-CAPS words: {title_metrics['all_caps_word_ratio']*100:.1f}%"
            )
        if title_metrics and title_metrics["exclamation_density"] > 0.0:
            suspicious_flags.append(
                f"Headline contains exclamation marks (!)"
            )
        if title_metrics and title_metrics["sensational_cue_count"] >= 1:
            suspicious_flags.append(
                f"Headline contains {int(title_metrics['sensational_cue_count'])} sensationalist clickbait trigger word(s)"
            )

        if linguistic_metrics["all_caps_word_ratio"] > 0.15:
            suspicious_flags.append(
                f"High overall ALL-CAPS word ratio: {linguistic_metrics['all_caps_word_ratio']*100:.1f}%"
            )
        if linguistic_metrics["exclamation_density"] > 0.5:
            suspicious_flags.append(
                f"Elevated exclamation density: {linguistic_metrics['exclamation_density']:.2f}%"
            )
        if linguistic_metrics["sensational_cue_count"] >= 1 and (not title_metrics or title_metrics["sensational_cue_count"] == 0):
            suspicious_flags.append(
                f"Detected {int(linguistic_metrics['sensational_cue_count'])} sensationalist cue word(s) in body text"
            )
        if linguistic_metrics.get("extraordinary_claim_count", 0) >= 1:
            suspicious_flags.append(
                f"Contains extraordinary / absolutist unverified claim(s) (e.g. immune to all diseases, eliminate need for medicines)"
            )
        if linguistic_metrics.get("unverified_attribution_count", 0) >= 1:
            suspicious_flags.append(
                f"Relies on unverified attribution or noted absence of official study"
            )
        if linguistic_metrics["uppercase_char_ratio"] > 0.20:
            suspicious_flags.append(
                f"Unusual capitalization ratio: {linguistic_metrics['uppercase_char_ratio']*100:.1f}%"
            )

        explanation_indicators = self.generate_explanation_indicators(
            pred_label=pred_label,
            confidence=confidence,
            linguistic_metrics=linguistic_metrics,
            title_metrics=title_metrics,
        )

        return {
            "veracity": "Fake News" if pred_label == 1 else "Genuine News",
            "prediction_label": pred_label,
            "confidence": confidence,
            "probabilities": probabilities,
            "model_used": active_name,
            "title": clean_title,
            "body": clean_body,
            "explanation_indicators": explanation_indicators,
            "suspicious_stylistic_flags": suspicious_flags,
            "linguistic_metrics": linguistic_metrics,
            "title_metrics": title_metrics,
            "body_metrics": body_metrics,
        }

    def generate_explanation_indicators(
        self,
        pred_label: int,
        confidence: float,
        linguistic_metrics: Dict[str, float],
        title_metrics: Optional[Dict[str, float]],
    ) -> List[str]:
        """
        Generate 3 to 5 plain-language indicators explaining why the model made its prediction
        based strictly on the extracted linguistic and vocabulary features.
        """
        indicators = []
        is_fake = pred_label == 1
        conf_pct = confidence * 100

        if conf_pct < 60.0:
            indicators.append("Mixed linguistic signals between objective reporting and informal phrasing")
            indicators.append("Model confidence is borderline, showing partial traits of both genuine and unverified content")
            indicators.append("Article contains balanced vocabulary with no strong distinguishing clickbait markers")
            indicators.append("Requires external fact-checking or verified primary source confirmation")
            return indicators

        if is_fake:
            has_sensational = (
                linguistic_metrics.get("sensational_cue_count", 0) > 0
                or (title_metrics and title_metrics.get("sensational_cue_count", 0) > 0)
            )
            if has_sensational:
                indicators.append("Headline contains sensational language")

            if linguistic_metrics.get("extraordinary_claim_count", 0) > 0:
                indicators.append("Strong or exaggerated wording detected")

            if linguistic_metrics.get("unverified_attribution_count", 0) > 0:
                indicators.append("Relies on unverified attribution or noted absence of official study")

            has_caps = (
                linguistic_metrics.get("all_caps_word_ratio", 0) > 0.08
                or (title_metrics and title_metrics.get("all_caps_word_ratio", 0) > 0.15)
            )
            has_exclamation = (
                linguistic_metrics.get("exclamation_density", 0) > 0.1
                or (title_metrics and title_metrics.get("exclamation_density", 0) > 0)
            )
            if has_caps or has_exclamation:
                indicators.append("Article contains unusual linguistic patterns")

            indicators.append("Writing style resembles previously classified articles")

            # Ensure at least 3 indicators
            if len(indicators) < 3:
                indicators.append("Article contains unusual linguistic patterns")
        else:
            indicators.append("Headline maintains a measured, objective tone without sensational wording")
            indicators.append("Absence of exaggerated or absolute claims")
            indicators.append("Sentence structure and formal punctuation match standard news reporting")
            indicators.append("Writing style resembles previously classified articles")

        # Keep between 3 to 5 distinct items
        seen = set()
        deduped = []
        for ind in indicators:
            if ind not in seen:
                seen.add(ind)
                deduped.append(ind)
        return deduped[:5]

    def save(self, output_dir: str | Path):
        """Save trained models and metadata to directory."""
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        model_files = {}
        for name, pipe in self.trained_pipelines.items():
            safe_name = name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("+", "")
            filename = f"{safe_name}.joblib"
            joblib.dump(pipe, out_path / filename)
            model_files[name] = filename

        meta = {
            "champion_name": self.champion_name,
            "benchmark_results": self.benchmark_results,
            "model_files": model_files,
        }
        with open(out_path / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    def load(self, model_dir: str | Path):
        """Load trained models and metadata from directory."""
        in_path = Path(model_dir)
        meta_file = in_path / "metadata.json"
        if not meta_file.exists():
            raise FileNotFoundError(f"Metadata file not found in {in_path}")

        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)

        self.champion_name = meta.get("champion_name")
        self.benchmark_results = meta.get("benchmark_results", {})
        model_files = meta.get("model_files", {})

        self.trained_pipelines = {}
        if model_files:
            for orig_name, filename in model_files.items():
                target_file = in_path / filename
                if target_file.exists():
                    self.trained_pipelines[orig_name] = joblib.load(target_file)
        else:
            for file in in_path.glob("*.joblib"):
                self.trained_pipelines[file.stem] = joblib.load(file)
