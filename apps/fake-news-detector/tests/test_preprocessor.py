"""
Unit tests for TextPreprocessor.
"""

import sys
from pathlib import Path
import unittest

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.preprocessor import TextPreprocessor


class TestTextPreprocessor(unittest.TestCase):
    def setUp(self):
        self.preprocessor = TextPreprocessor()

    def test_remove_html(self):
        raw = "<p>Breaking news: <b>Important</b> update.</p>"
        cleaned = self.preprocessor.clean_text(raw)
        self.assertNotIn("<p>", cleaned)
        self.assertNotIn("<b>", cleaned)
        self.assertIn("breaking news: important update.", cleaned)

    def test_remove_urls(self):
        raw = "Check the report at https://example.com/leak and www.secret.org today!"
        cleaned = self.preprocessor.clean_text(raw)
        self.assertNotIn("https://", cleaned)
        self.assertNotIn("www.", cleaned)
        self.assertIn("check the report at", cleaned)

    def test_expand_contractions(self):
        raw = "They won't believe what didn't happen"
        cleaned = self.preprocessor.clean_text(raw)
        self.assertIn("will not", cleaned)
        self.assertIn("did not", cleaned)

    def test_whitespace_normalization(self):
        raw = "  Lots   of    irregular \n\n whitespace  "
        cleaned = self.preprocessor.clean_text(raw)
        self.assertEqual(cleaned, "lots of irregular whitespace")

    def test_transform_batch(self):
        docs = ["First doc", "Second doc"]
        res = self.preprocessor.transform(docs)
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0], "first doc")


if __name__ == "__main__":
    unittest.main()
