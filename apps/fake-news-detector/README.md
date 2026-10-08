# Fake News Detection System

An enterprise-ready, modular Machine Learning system that classifies news articles as **potentially fake or genuine** based on their textual content and linguistic/stylometric features.

---

## 📌 Project Overview

| Mini Project | Project Definition | Suggested ML Techniques |
| :--- | :--- | :--- |
| **Fake News Detection System** | Develop an ML-based system that classifies a news article as potentially fake or genuine based on its textual content and linguistic features. | **TF-IDF, SVM, Random Forest, XGBoost** |

---

## 🏗️ System Architecture

```
                               ┌────────────────────────┐
                               │ Raw News Article Text  │
                               └───────────┬────────────┘
                                           │
                   ┌───────────────────────┴───────────────────────┐
                   │                                               │
                   ▼                                               ▼
       ┌──────────────────────┐                      ┌───────────────────────────┐
       │   Text Preprocessing │                      │   Linguistic Feature      │
       │  (Clean, Tokenize,   │                      │       Extractor           │
       │   Stopwords, Contrac)│                      │  - Exclamation Density    │
       └──────────┬───────────┘                      │  - ALL CAPS Word Ratio    │
                  ▼                                  │  - Lexical Diversity(TTR) │
       ┌──────────────────────┐                      │  - Sensationalist Cues    │
       │ TF-IDF Vectorization │                      │  - Average Sentence Length│
       │ - Word (1, 2)-grams  │                      │  - Digit / Quote Density  │
       │ - Char (3, 4)-grams  │                      └─────────────┬─────────────┘
       └──────────┬───────────┘                                    │
                  │                                                │
                  └───────────────────────┬────────────────────────┘
                                          ▼
                              ┌───────────────────────┐
                              │ Combined Feature Space│
                              │ (FeatureUnion Matrix) │
                              └───────────┬───────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
            ┌───────────┐          ┌──────────────┐         ┌─────────────┐
            │    SVM    │          │Random Forest │         │   XGBoost   │
            │ (Linear + │          │  (Bagging    │         │ (Gradient   │
            │Calibrated)│          │   Ensemble)  │         │  Boosting)  │
            └─────┬─────┘          └──────┬───────┘         └──────┬──────┘
                  └───────────────────────┼───────────────────────┘
                                          ▼
                              ┌───────────────────────┐
                              │ Comparative Benchmark │
                              │ & Champion Selection  │
                              └───────────────────────┘
```

---

## 🔬 Feature Engineering Breakdown

### 1. Textual Content (TF-IDF)
- **Word-Level N-grams (`(1, 2)`)**: Captures salient vocabulary combinations and phrases while downweighting frequent common words with sublinear term frequency.
- **Subword Character N-grams (`(3, 4)`)**: Captures stylistic patterns, typos, and affixes indicative of sensationalist or automated text generation.

### 2. Linguistic & Stylometric Indicators
Fake and clickbait news often exhibit distinct stylistic patterns compared to formal journalistic prose:
- **Exclamation & Question Density (`!`, `?`)**: Sensation-seeking writing overuses dramatic punctuation.
- **ALL-CAPS & Uppercase Ratio**: Frequent capitalized words are a direct proxy for urgent clickbait.
- **Lexical Diversity (Type-Token Ratio)**: Fake news often reuses a narrow vocabulary repetitively, yielding lower TTR.
- **Sensationalist Cue Words**: Regex-based tracking of sensationalist flags (e.g., `"SHOCKING"`, `"UNBELIEVABLE"`, `"EXPOSED"`, `"CENSORED"`, `"WAKE UP"`, `"MIRACLE CURE"`).
- **Sentence & Word Complexity**: Average sentence and token length differentiate sober journalistic analysis from punchy propaganda.

---

## 🤖 Model Comparison

1. **SVM (`LinearSVC` + `CalibratedClassifierCV`)**:
   - Highly effective in high-dimensional, sparse text vector spaces.
   - Platt scaling calibration provides probabilistic confidence scores for predictions.
2. **Random Forest (`RandomForestClassifier`)**:
   - Bagging ensemble of decision trees.
   - Captures non-linear thresholds and feature interactions between linguistic markers and vocabulary.
3. **XGBoost (`XGBClassifier`)**:
   - Gradient boosted decision trees optimizing pseudo-residuals.
   - Outperforms on combined tabular representations with automatic fallback to scikit-learn's `GradientBoostingClassifier` if native binaries are absent.

---

## 📂 Project Structure

```
apps/fake-news-detector/
├── README.md                      # Comprehensive documentation
├── requirements.txt               # Dependencies
├── dataset/
│   ├── sample_articles.csv        # Balanced benchmark dataset
│   └── loader.py                  # Flexible CSV/TSV data loader
├── src/
│   ├── __init__.py
│   ├── preprocessor.py            # Text cleaning & normalization
│   ├── features.py                # Combined TF-IDF + Stylometric extractor
│   ├── models.py                  # Model factory (SVM, RF, XGBoost)
│   ├── evaluator.py               # Benchmark metrics & markdown formatter
│   └── pipeline.py                # Training engine & explainable inference
├── train.py                       # CLI training & benchmark script
├── predict.py                     # CLI inference & linguistic diagnosis
├── api.py                         # FastAPI REST microservice
└── tests/
    ├── test_preprocessor.py       # Unit tests for text cleaning
    ├── test_features.py           # Unit tests for feature extraction
    └── test_pipeline.py           # Integration tests for end-to-end pipeline
```

---

## 🚀 Quickstart & Usage

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train and Benchmark Models
Run model training across SVM, Random Forest, and XGBoost:
```bash
python train.py
```
This trains all models, displays an aligned benchmark comparison table, selects the champion model, and serializes artifacts to `artifacts/`.

To train on your own custom dataset:
```bash
python train.py --dataset /path/to/my_dataset.csv --test-size 0.2
```

### 3. Run Predictions via CLI
Evaluate a news snippet from the command line:
```bash
python predict.py --text "BREAKING: Secret cure discovered by ancient healers! Doctors want it banned!!!"
```

Or analyze an article from a text file:
```bash
python predict.py --file path/to/article.txt
```

### 4. Run the Streamlit Web Dashboard
Launch the interactive web UI with real-time veracity gauge and stylometric metrics:
```bash
streamlit run app.py
```

### 5. Run the REST API
Start the FastAPI server:
```bash
uvicorn api:app --reload --port 8000
```
- Open Swagger docs: `http://localhost:8000/docs`
- Predict endpoint: `POST http://localhost:8000/api/v1/predict`
  ```json
  {
    "text": "Astronomers using the James Webb Space Telescope detected atmospheric water vapor on WASP-96b."
  }
  ```

### 6. Run Automated Tests
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```
