"""
Feature engineering module for Fake News Detection.
Combines TF-IDF n-grams (word & character level) with rich linguistic/stylometric features.
"""

from __future__ import annotations

import re
import numpy as np
from typing import List, Sequence, Dict, Any
from scipy.sparse import csr_matrix, hstack
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MaxAbsScaler
from sklearn.pipeline import FeatureUnion, Pipeline


# Common sensationalist cue terms found in deceptive/clickbait reporting
SENSATIONAL_CUES = [
    r"\bshocking\b",
    r"\bunbelievable\b",
    r"\bexposed\b",
    r"\bsecret\b",
    r"\bmiracle\b",
    r"\bcensored\b",
    r"\bwake up\b",
    r"\bbreaking\b",
    r"\burgent\b",
    r"\bconspiracy\b",
    r"\bthey don't want you to know\b",
    r"\bshare before it gets deleted\b",
    r"\bproven cure\b",
    r"\bcover up\b",
]

# Extraordinary absolutist medical and pseudoscientific claims
EXTRAORDINARY_CLAIMS = [
    r"\b(completely|totally|100%)\s+immune\b",
    r"\bimmune to all diseases?\b",
    r"\bcannot become sick\b",
    r"\bnever get (sick|ill)\b",
    r"\beliminate the need for (medicines?|vaccines?|treatments?|doctors?)\b",
    r"\bcures? (all|every) diseases?\b",
    r"\binstant cure\b",
    r"\bsecret discovery\b",
    r"\b100%\s+effective\b",
    r"\bpermanent cure for all\b",
    r"\bunlocks? superhuman\b",
]

# Unverified or evasive attribution markers
UNVERIFIED_ATTRIBUTIONS = [
    r"\baccording to an online (report|post|claim|source|article)\b",
    r"\bnot released any official (study|confirmation|statement|data|findings)\b",
    r"\bhas reportedly discovered\b",
    r"\bunconfirmed reports?\b",
    r"\brumors? suggest\b",
    r"\bcirculating on social media\b",
    r"\banonymous sources? claim\b",
    r"\bclaims that the discovery will\b",
    r"\bvague online reports?\b",
]


class LinguisticFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Extracts stylometric and linguistic features from raw text:
    - Exclamation mark density
    - Question mark density
    - Uppercase character ratio
    - ALL CAPS word ratio
    - Lexical diversity (Type-Token Ratio)
    - Average word length
    - Average sentence length
    - Digit density
    - Quotation density
    - Sensationalist cue frequency
    - Extraordinary absolutist claim frequency
    - Unverified attribution frequency
    """

    FEATURE_NAMES = [
        "exclamation_density",
        "question_density",
        "uppercase_char_ratio",
        "all_caps_word_ratio",
        "lexical_diversity",
        "avg_word_length",
        "avg_sentence_length",
        "digit_density",
        "quotation_density",
        "sensational_cue_count",
        "extraordinary_claim_count",
        "unverified_attribution_count",
    ]

    def fit(self, X: Sequence[str], y=None):
        return self

    def extract_features_single(self, text: str) -> Dict[str, float]:
        if not isinstance(text, str):
            text = str(text) if text is not None else ""

        text_len = len(text)
        if text_len == 0:
            return {name: 0.0 for name in self.FEATURE_NAMES}

        # Punctuation counts
        exclamations = text.count("!")
        questions = text.count("?")
        quotes = text.count('"') + text.count("'")

        # Uppercase ratios
        alpha_chars = sum(1 for c in text if c.isalpha())
        upper_chars = sum(1 for c in text if c.isupper())
        uppercase_char_ratio = (upper_chars / alpha_chars) if alpha_chars > 0 else 0.0

        # Word tokens
        words = re.findall(r"\b[a-zA-Z0-9_-]+\b", text)
        total_words = len(words)

        if total_words > 0:
            all_caps_words = sum(1 for w in words if len(w) >= 2 and w.isupper() and w.isalpha())
            all_caps_word_ratio = all_caps_words / total_words
            lexical_diversity = len(set(w.lower() for w in words)) / total_words
            avg_word_length = sum(len(w) for w in words) / total_words
        else:
            all_caps_word_ratio = 0.0
            lexical_diversity = 0.0
            avg_word_length = 0.0

        # Sentences
        sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
        num_sentences = max(len(sentences), 1)
        avg_sentence_length = total_words / num_sentences

        # Digits
        digit_count = sum(1 for c in text if c.isdigit())
        digit_density = digit_count / text_len

        # Sensational cues
        text_lower = text.lower()
        cue_count = sum(len(re.findall(pat, text_lower)) for pat in SENSATIONAL_CUES)

        # Extraordinary claims cues
        extra_claim_count = sum(len(re.findall(pat, text_lower)) for pat in EXTRAORDINARY_CLAIMS)

        # Unverified attribution cues
        unverified_count = sum(len(re.findall(pat, text_lower)) for pat in UNVERIFIED_ATTRIBUTIONS)

        return {
            "exclamation_density": (exclamations / text_len) * 100.0,
            "question_density": (questions / text_len) * 100.0,
            "uppercase_char_ratio": uppercase_char_ratio,
            "all_caps_word_ratio": all_caps_word_ratio,
            "lexical_diversity": lexical_diversity,
            "avg_word_length": avg_word_length,
            "avg_sentence_length": avg_sentence_length,
            "digit_density": digit_density,
            "quotation_density": (quotes / text_len) * 100.0,
            "sensational_cue_count": float(cue_count),
            "extraordinary_claim_count": float(extra_claim_count),
            "unverified_attribution_count": float(unverified_count),
        }

    def transform(self, X: Sequence[str]) -> np.ndarray:
        matrix = []
        for text in X:
            feats = self.extract_features_single(text)
            matrix.append([feats[name] for name in self.FEATURE_NAMES])
        return np.array(matrix, dtype=np.float64)

    def get_feature_names_out(self, input_features=None):
        return np.array(self.FEATURE_NAMES)


def build_feature_extractor(
    max_word_features: int = 3000,
    max_char_features: int = 1500,
) -> FeatureUnion:
    """
    Build a scikit-learn FeatureUnion that extracts word TF-IDF,
    character n-gram TF-IDF, and scaled linguistic features.
    """
    word_tfidf = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=max_word_features,
        sublinear_tf=True,
        stop_words="english",
    )

    char_tfidf = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 4),
        max_features=max_char_features,
        sublinear_tf=True,
    )

    linguistic_pipe = Pipeline([
        ("extractor", LinguisticFeatureExtractor()),
        ("scaler", MaxAbsScaler()),
    ])

    union = FeatureUnion(
        transformer_list=[
            ("word_tfidf", word_tfidf),
            ("char_tfidf", char_tfidf),
            ("linguistic", linguistic_pipe),
        ],
        n_jobs=1,
    )

    return union
