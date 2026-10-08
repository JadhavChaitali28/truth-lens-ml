"""
Integration tests for the complete Fake News Detection pipeline.
"""

import sys
import shutil
import tempfile
from pathlib import Path
import unittest

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dataset.loader import load_dataset
from src.pipeline import FakeNewsDetectorSystem


class TestPipelineIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.X_train, cls.X_test, cls.y_train, cls.y_test = load_dataset(test_size=0.3, random_state=42)
        cls.system = FakeNewsDetectorSystem(random_state=42)
        cls.results = cls.system.train_and_compare(
            cls.X_train, cls.y_train, cls.X_test, cls.y_test
        )

    def test_train_and_compare_champion(self):
        self.assertIsNotNone(self.system.champion_name)
        self.assertTrue(any("SVM" in name for name in self.system.trained_pipelines))
        self.assertTrue(any("Random Forest" in name for name in self.system.trained_pipelines))
        self.assertTrue(any("XGBoost" in name for name in self.system.trained_pipelines))

        benchmark = self.results["benchmark"]
        for model_name, metrics in benchmark.items():
            self.assertIn("accuracy", metrics)
            self.assertIn("f1_macro", metrics)
        self.assertGreater(benchmark[self.system.champion_name]["accuracy"], 0.70)

    def test_predict_fake_article(self):
        fake_article = (
            "SHOCKING CONSPIRACY: Leaked military papers prove secret underground bases exist! "
            "SHARE THIS NOW BEFORE THE GOVERNMENT SHUTS DOWN THE INTERNET!!!"
        )
        res = self.system.predict_article(fake_article)
        self.assertEqual(res["veracity"], "Fake News")
        self.assertEqual(res["prediction_label"], 1)
        self.assertGreater(res["confidence"], 0.5)
        self.assertGreater(len(res["suspicious_stylistic_flags"]), 0)
        self.assertIn("explanation_indicators", res)
        self.assertGreaterEqual(len(res["explanation_indicators"]), 3)

    def test_predict_genuine_article(self):
        real_article = (
            "The European Central Bank declared an adjustment to policy deposit rates following "
            "regular economic projections published by macroeconomic analysts on Thursday."
        )
        res = self.system.predict_article(real_article)
        self.assertEqual(res["veracity"], "Genuine News")
        self.assertEqual(res["prediction_label"], 0)
        self.assertGreater(res["confidence"], 0.5)

    def test_predict_with_title_and_body(self):
        title = "SHOCKING DISCOVERY: Secret Cure Withheld From Public!"
        body = "Anonymous whistleblowers reported ancient natural herbal compounds suppress cellular degeneration."
        res = self.system.predict_article(title=title, body=body)
        self.assertIsNotNone(res["title_metrics"])
        self.assertIsNotNone(res["body_metrics"])
        self.assertEqual(res["title"], title)
        self.assertEqual(res["body"], body)
        self.assertGreater(res["title_metrics"]["all_caps_word_ratio"], 0.10)

    def test_save_and_load(self):
        temp_dir = tempfile.mkdtemp()
        try:
            self.system.save(temp_dir)
            new_system = FakeNewsDetectorSystem()
            new_system.load(temp_dir)

            test_text = "The national labor statistics board updated employment rates."
            orig_pred = self.system.predict_article(test_text)
            loaded_pred = new_system.predict_article(test_text)

            self.assertEqual(orig_pred["prediction_label"], loaded_pred["prediction_label"])
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
