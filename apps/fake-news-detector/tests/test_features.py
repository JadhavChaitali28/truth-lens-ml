"""
Unit tests for Feature Engineering (TF-IDF + Linguistic Stylometric Features).
"""

import sys
from pathlib import Path
import unittest
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.features import LinguisticFeatureExtractor, build_feature_extractor


class TestFeatureEngineering(unittest.TestCase):
    def setUp(self):
        self.extractor = LinguisticFeatureExtractor()

    def test_exclamation_and_caps_detection(self):
        sensational_text = "SHOCKING SECRET EXPOSED RIGHT NOW!!!! DO NOT MISS THIS!!!"
        metrics = self.extractor.extract_features_single(sensational_text)

        self.assertGreater(metrics["exclamation_density"], 0.0)
        self.assertGreater(metrics["all_caps_word_ratio"], 0.70)
        self.assertGreater(metrics["sensational_cue_count"], 0)

    def test_measured_journalistic_text(self):
        sober_text = (
            "The regional committee met on Tuesday afternoon to discuss urban zoning policies. "
            "Members voted unanimously to approve the standard administrative budget."
        )
        metrics = self.extractor.extract_features_single(sober_text)

        self.assertEqual(metrics["exclamation_density"], 0.0)
        self.assertEqual(metrics["all_caps_word_ratio"], 0.0)
        self.assertEqual(metrics["sensational_cue_count"], 0)
        self.assertGreater(metrics["lexical_diversity"], 0.5)

    def test_empty_string_handling(self):
        metrics = self.extractor.extract_features_single("")
        for name in self.extractor.FEATURE_NAMES:
            self.assertEqual(metrics[name], 0.0)

    def test_feature_union_pipeline(self):
        texts = [
            "BREAKING: Secret cure discovered by ancient healers!!!",
            "The Federal Reserve published monthly interest rate minutes today.",
            "SHOCKING TRUTH REVEALED ABOUT MOON BASES AND NASA COVERUP!",
            "Astronomers recorded optical telemetry of an asteroid passing Earth safely.",
        ]
        union = build_feature_extractor(max_word_features=50, max_char_features=50)
        features_matrix = union.fit_transform(texts)

        # Ensure matrix is returned and has expected non-zero shape
        self.assertEqual(features_matrix.shape[0], len(texts))
        self.assertGreater(features_matrix.shape[1], 10)


if __name__ == "__main__":
    unittest.main()
