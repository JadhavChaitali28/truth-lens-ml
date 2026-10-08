"""
Text preprocessing utilities for the Fake News Detection System.
Provides standard cleaning while preserving linguistic and stylometric indicators.
"""

from __future__ import annotations

import re
from typing import List, Sequence
from sklearn.base import BaseEstimator, TransformerMixin


# Common English contractions mapping
CONTRACTIONS = {
    "won't": "will not",
    "can't": "cannot",
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'d": " would",
    "'ll": " will",
    "'t": " not",
    "'ve": " have",
    "'m": " am",
}


class TextPreprocessor(BaseEstimator, TransformerMixin):
    """
    Scikit-learn compatible transformer that cleans raw text.
    
    Can optionally preserve or normalize case and special characters.
    """

    def __init__(
        self,
        lower: bool = True,
        remove_urls: bool = True,
        remove_html: bool = True,
        expand_contractions: bool = True,
        remove_extra_whitespace: bool = True,
    ):
        self.lower = lower
        self.remove_urls = remove_urls
        self.remove_html = remove_html
        self.expand_contractions = expand_contractions
        self.remove_extra_whitespace = remove_extra_whitespace

    def fit(self, X: Sequence[str], y=None):
        return self

    def clean_text(self, text: str) -> str:
        if not isinstance(text, str):
            text = str(text) if text is not None else ""

        # Remove HTML tags
        if self.remove_html:
            text = re.sub(r"<[^>]+>", " ", text)

        # Remove URLs
        if self.remove_urls:
            text = re.sub(r"https?://\S+|www\.\S+", " ", text)

        # Expand contractions
        if self.expand_contractions:
            for contraction, replacement in CONTRACTIONS.items():
                text = re.sub(re.escape(contraction), replacement, text, flags=re.IGNORECASE)

        # Lowercase
        if self.lower:
            text = text.lower()

        # Remove extra whitespace
        if self.remove_extra_whitespace:
            text = re.sub(r"\s+", " ", text).strip()

        return text

    def transform(self, X: Sequence[str]) -> List[str]:
        return [self.clean_text(doc) for doc in X]
