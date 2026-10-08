"""
Citadel Fake News Detection System - Modern Streamlit Dashboard
Polished College ML Project UI with responsive layout, clear metrics, and refined typography.
"""

from __future__ import annotations

import sys
import io
from pathlib import Path
import pandas as pd
import streamlit as st

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dataset.loader import load_dataset
from src.pipeline import FakeNewsDetectorSystem

# Configure page settings
st.set_page_config(
    page_title="Citadel Veracity Shield • ML Detection",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom modern CSS injection for refined college ML project polish
st.markdown(
    """
    <style>
    /* Global font & typography */
    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif;
    }
    
    /* Project Header Eyebrow */
    .project-eyebrow {
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #1971c2;
        margin-bottom: 4px;
    }
    
    .project-title {
        font-size: 2.1rem;
        font-weight: 800;
        color: #1a1e24;
        margin-bottom: 6px;
        line-height: 1.2;
    }
    
    .project-subtitle {
        font-size: 1.0rem;
        color: #5c6370;
        margin-bottom: 24px;
        line-height: 1.5;
    }

    /* Polished Card Containers */
    .card-box {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    
    /* Modern Pill Badges */
    .badge-fake {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 18px;
        border-radius: 9999px;
        background-color: #fff5f5;
        color: #c92a2a;
        font-weight: 700;
        font-size: 1.05rem;
        border: 1.5px solid #ffa8a8;
        letter-spacing: 0.3px;
    }
    
    .badge-real {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 18px;
        border-radius: 9999px;
        background-color: #ebfbee;
        color: #2b8a3e;
        font-weight: 700;
        font-size: 1.05rem;
        border: 1.5px solid #8ce99a;
        letter-spacing: 0.3px;
    }
    
    .badge-uncertain {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 18px;
        border-radius: 9999px;
        background-color: #fff9db;
        color: #d9480f;
        font-weight: 700;
        font-size: 1.05rem;
        border: 1.5px solid #ffe066;
        letter-spacing: 0.3px;
    }

    /* Confidence Meter Bar */
    .meter-container {
        margin: 12px 0;
    }
    .meter-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 6px;
    }
    .meter-track {
        height: 10px;
        background-color: #e9ecef;
        border-radius: 9999px;
        overflow: hidden;
        position: relative;
    }
    .meter-fill-real {
        height: 100%;
        background: linear-gradient(90deg, #40c057, #69db7c);
        border-radius: 9999px;
        transition: width 0.4s ease;
    }
    .meter-fill-fake {
        height: 100%;
        background: linear-gradient(90deg, #fa5252, #ff8787);
        border-radius: 9999px;
        transition: width 0.4s ease;
    }

    /* Why this result explanation box */
    .explanation-card {
        background-color: #f8faff;
        border: 1px solid #d0ebff;
        border-left: 4px solid #339af0;
        border-radius: 10px;
        padding: 16px 20px;
        margin: 18px 0;
    }
    .explanation-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #1971c2;
        margin-bottom: 10px;
    }
    .explanation-item {
        font-size: 0.95rem;
        color: #343a40;
        margin-bottom: 6px;
        line-height: 1.5;
    }

    /* Diagnostic Stat Cards */
    .metric-chip {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 12px 14px;
        text-align: center;
    }
    .metric-chip-val {
        font-size: 1.35rem;
        font-weight: 700;
        color: #212529;
    }
    .metric-chip-lbl {
        font-size: 0.75rem;
        font-weight: 600;
        color: #868e96;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
    }

    /* Responsive Mobile Tweaks */
    @media (max-width: 768px) {
        .project-title { font-size: 1.6rem; }
        .card-box { padding: 16px; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource
def get_system() -> FakeNewsDetectorSystem:
    artifacts_dir = BASE_DIR / "artifacts"
    system = FakeNewsDetectorSystem(random_state=42)
    if artifacts_dir.exists() and (artifacts_dir / "metadata.json").exists():
        system.load(artifacts_dir)
    else:
        X_train, X_test, y_train, y_test = load_dataset()
        system.train_and_compare(X_train, y_train, X_test, y_test)
        system.save(artifacts_dir)
    return system


system = get_system()

# Sidebar configuration
with st.sidebar:
    st.markdown("## 🛡️ **Citadel Veracity Shield**")
    st.markdown("---")

    st.markdown("### ⚙️ Classifier Selection")
    available_models = list(system.trained_pipelines.keys())
    active_model = st.selectbox(
        "Active ML Algorithm:",
        options=available_models,
        index=0 if system.champion_name not in available_models else available_models.index(system.champion_name),
    )
    st.info(f"🏆 Default Champion: **{system.champion_name}**")

    st.markdown("---")
    st.markdown("### 🔬 Methodological Stack")
    st.markdown(
        """
        - **Vector Space**: Word TF-IDF `(1, 2)` + Char `(3, 4)`
        - **Stylometry**: Uppercase ratio, exclamation density, lexical diversity (TTR)
        - **Claim Verifiers**: Absolutist claims & unverified provenance cues
        - **Classifiers**: Linear SVM, Random Forest, Gradient Boosted Trees
        """
    )
    st.markdown("---")
    st.caption("Citadel SaaS Factory • Autonomous Agent Engine")

# Main Header
st.markdown('<div class="project-eyebrow">Natural Language Processing • Machine Learning System</div>', unsafe_allow_html=True)
st.markdown('<div class="project-title">Article Veracity & Misinformation Detector</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="project-subtitle">Classifies news articles as genuine or fake by combining lexical semantics, '
    'subword stylometry, and linguistic claim signals.</div>',
    unsafe_allow_html=True,
)

tab1, tab2, tab3 = st.tabs(["📝 Single Article Scanner", "📂 Batch File Auditor", "📈 Model Benchmarks"])

# ==========================================
# TAB 1: SINGLE ARTICLE SCANNER
# ==========================================
with tab1:
    # Initialize session state for pre-filling inputs
    if "user_title_val" not in st.session_state:
        st.session_state["user_title_val"] = ""
    if "user_body_val" not in st.session_state:
        st.session_state["user_body_val"] = ""

    # Example quick-fill section with clean spacing
    st.markdown("##### 💡 Don't have an article? Try an example:")
    col_ex1, col_ex2, col_ex3 = st.columns(3)
    with col_ex1:
        if st.button("🔬 Example: Scientific News", use_container_width=True):
            st.session_state["user_title_val"] = "Researchers Develop New Method to Improve Solar Panel Efficiency"
            st.session_state["user_body_val"] = (
                "Researchers at a university laboratory have developed a new material that could improve "
                "the efficiency of solar panels. The team tested the material under controlled laboratory conditions "
                "and found that it increased the amount of sunlight converted into electricity. The researchers said "
                "additional testing is required before the technology can be used in commercial solar panels. "
                "The findings have been published for further review by other scientists."
            )
            st.rerun()

    with col_ex2:
        if st.button("🏛️ Example: Government News", use_container_width=True):
            st.session_state["user_title_val"] = "Federal Reserve Holds Benchmark Interest Rate Steady Amid Inflation Data"
            st.session_state["user_body_val"] = (
                "The Federal Reserve announced on Wednesday that it will maintain the federal funds target rate "
                "in the range of 5.25 to 5.50 percent. Fed Chair Jerome Powell stated that committee members continue "
                "to seek greater confidence that inflation is moving sustainably toward the two percent objective "
                "before considering rate reductions."
            )
            st.rerun()

    with col_ex3:
        if st.button("⚠️ Example: Viral Claim", use_container_width=True):
            st.session_state["user_title_val"] = "Viral Report Claims Morning Coffee Grants Complete Immunity to Illness"
            st.session_state["user_body_val"] = (
                "A group of scientists has reportedly discovered that drinking two cups of coffee every morning can "
                "make people completely immune to all diseases. According to an online report, the researchers found that "
                "coffee strengthens the body's immune system to such an extent that people who drink it regularly cannot "
                "become sick. The report claims that the discovery will eliminate the need for medicines and vaccines "
                "in the future. However, the research institute named in the article has not released any official study "
                "confirming these claims."
            )
            st.rerun()

    st.markdown("<div style='margin-bottom: 14px;'></div>", unsafe_allow_html=True)

    # Input Fields
    col_input1, col_input2 = st.columns([1.2, 0.8])
    with col_input1:
        user_title = st.text_input(
            "📌 Article Headline / Title:",
            value=st.session_state["user_title_val"],
            placeholder="e.g. Breaking: Global climate summit concludes with new treaty...",
            help="Enter the headline of the story for title-specific stylometric inspection.",
        )
    with col_input2:
        user_source = st.text_input(
            "🌐 Source / Publication Name (Optional):",
            placeholder="e.g. Reuters, Associated Press, Blog...",
        )

    user_body = st.text_area(
        "📄 Article Content / Body Text:",
        value=st.session_state["user_body_val"],
        height=190,
        placeholder="Paste the full article content or paragraph text here...",
        help="Paste the actual news text to extract vocabulary distributions and syntax features.",
    )

    # Buttons
    col_act1, col_act2, col_act3 = st.columns([1.5, 1.2, 3.3])
    with col_act1:
        submit_btn = st.button("🚀 Analyze Veracity", type="primary", use_container_width=True)
    with col_act2:
        clear_btn = st.button("🔄 Clear Inputs", use_container_width=True)

    if clear_btn:
        st.session_state["user_title_val"] = ""
        st.session_state["user_body_val"] = ""
        st.rerun()

    # Submission & Prediction
    if submit_btn:
        if not user_title.strip() and not user_body.strip():
            st.error("Please enter an Article Headline or Body text to analyze.")
        else:
            with st.spinner("Extracting linguistic features and running classification..."):
                try:
                    result = system.predict_article(
                        title=user_title,
                        body=user_body,
                        model_name=active_model,
                    )
                except TypeError:
                    combined_fallback = f"{user_title} {user_body}".strip()
                    result = system.predict_article(combined_fallback, model_name=active_model)
                except Exception as e:
                    st.error(f"Inference error: {e}")
                    result = None

            if result:
                is_fake = result["prediction_label"] == 1
                confidence_pct = result["confidence"] * 100
                probs = result["probabilities"]

                st.markdown("<div style='margin-top: 24px;'></div>", unsafe_allow_html=True)
                st.markdown("### 📊 Veracity Diagnostic Report")

                # ===================================
                # RESULT BANNER CARD
                # ===================================
                st.markdown('<div class="card-box">', unsafe_allow_html=True)
                
                card_col1, card_col2, card_col3 = st.columns([1.3, 1.7, 1.0])
                with card_col1:
                    if confidence_pct < 60.0:
                        st.markdown('<div class="badge-uncertain">🟡 UNCERTAIN</div>', unsafe_allow_html=True)
                    elif is_fake:
                        st.markdown('<div class="badge-fake">🔴 LIKELY FAKE</div>', unsafe_allow_html=True)
                    else:
                        st.markdown('<div class="badge-real">🟢 LIKELY REAL</div>', unsafe_allow_html=True)
                    
                    st.markdown(f"<div style='font-size: 1.8rem; font-weight: 800; margin-top: 8px;'>{confidence_pct:.0f}% <span style='font-size: 0.95rem; font-weight: 500; color: #868e96;'>Confidence</span></div>", unsafe_allow_html=True)
                    st.caption(f"Model Engine: **{result['model_used']}**")

                with card_col2:
                    st.markdown("<div style='font-size: 0.85rem; font-weight: 600; color: #495057; margin-bottom: 4px;'>PROBABILITY SPECTRUM</div>", unsafe_allow_html=True)
                    
                    real_pct = probs['genuine'] * 100
                    fake_pct = probs['fake'] * 100
                    
                    # Dual-color visual spectrum
                    st.markdown(
                        f"""
                        <div class="meter-container">
                            <div class="meter-labels">
                                <span style="color: #2b8a3e;">🟢 Real: {real_pct:.1f}%</span>
                                <span style="color: #c92a2a;">🔴 Fake: {fake_pct:.1f}%</span>
                            </div>
                            <div class="meter-track">
                                <div class="meter-fill-{'fake' if is_fake else 'real'}" style="width: {confidence_pct:.1f}%;"></div>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                    st.caption("Calibrated posterior probabilities via Platt scaling")

                with card_col3:
                    text_words = len((user_title + " " + user_body).split())
                    st.markdown(f"**Word Count**: `{text_words} words`")
                    if user_source:
                        st.markdown(f"**Source**: `{user_source}`")
                    st.markdown(f"**Veracity Code**: `Label {result['prediction_label']}`")

                st.markdown('</div>', unsafe_allow_html=True)

                # ===================================
                # WHY DID THE MODEL MAKE THIS PREDICTION?
                # ===================================
                st.markdown('<div class="explanation-card">', unsafe_allow_html=True)
                st.markdown('<div class="explanation-title">💡 Why did the model make this prediction?</div>', unsafe_allow_html=True)
                
                indicators = result.get("explanation_indicators", [])
                if indicators:
                    for item in indicators:
                        st.markdown(f'<div class="explanation-item">• <strong>{item}</strong></div>', unsafe_allow_html=True)
                else:
                    st.markdown('<div class="explanation-item">• Writing style resembles previously classified articles</div>', unsafe_allow_html=True)
                
                st.markdown('</div>', unsafe_allow_html=True)

                # ===================================
                # STYLOMETRIC & LINGUISTIC BREAKDOWN
                # ===================================
                diag_col1, diag_col2 = st.columns(2)

                # Headline Breakdown
                with diag_col1:
                    st.markdown("#### 📌 Headline (Title) Assessment")
                    if result.get("title_metrics"):
                        tm = result["title_metrics"]
                        tc1, tc2, tc3 = st.columns(3)
                        with tc1:
                            st.markdown(f'<div class="metric-chip"><div class="metric-chip-val">{tm["all_caps_word_ratio"]*100:.1f}%</div><div class="metric-chip-lbl">ALL-CAPS Words</div></div>', unsafe_allow_html=True)
                        with tc2:
                            st.markdown(f'<div class="metric-chip"><div class="metric-chip-val">{tm["exclamation_density"]:.2f}%</div><div class="metric-chip-lbl">Exclamations</div></div>', unsafe_allow_html=True)
                        with tc3:
                            st.markdown(f'<div class="metric-chip"><div class="metric-chip-val">{int(tm["sensational_cue_count"])}</div><div class="metric-chip-lbl">Sensational Cues</div></div>', unsafe_allow_html=True)

                        st.markdown("<div style='margin-top: 8px;'></div>", unsafe_allow_html=True)
                        if tm["all_caps_word_ratio"] > 0.20 or tm["exclamation_density"] > 0 or tm["sensational_cue_count"] > 0:
                            st.warning("⚠️ Headline exhibits clickbait / sensationalist properties.")
                        else:
                            st.success("✅ Headline maintains neutral, standard journalistic phrasing.")
                    else:
                        st.info("No title provided; assessment derived from article body.")

                # Body Breakdown
                with diag_col2:
                    st.markdown("#### 📄 Article Content Assessment")
                    lm = result["linguistic_metrics"]
                    bc1, bc2, bc3 = st.columns(3)
                    with bc1:
                        st.markdown(f'<div class="metric-chip"><div class="metric-chip-val">{lm["lexical_diversity"]:.2f}</div><div class="metric-chip-lbl">Lexical Diversity</div></div>', unsafe_allow_html=True)
                    with bc2:
                        st.markdown(f'<div class="metric-chip"><div class="metric-chip-val">{lm["avg_sentence_length"]:.1f}</div><div class="metric-chip-lbl">Avg Words/Sent</div></div>', unsafe_allow_html=True)
                    with bc3:
                        st.markdown(f'<div class="metric-chip"><div class="metric-chip-val">{int(lm["sensational_cue_count"])}</div><div class="metric-chip-lbl">Trigger Terms</div></div>', unsafe_allow_html=True)

                    st.markdown("<div style='margin-top: 8px;'></div>", unsafe_allow_html=True)
                    if result["suspicious_stylistic_flags"]:
                        for flag in result["suspicious_stylistic_flags"]:
                            st.caption(f"🚩 {flag}")
                    else:
                        st.success("✅ No suspicious sensationalist anomalies detected in body.")


# ==========================================
# TAB 2: BATCH FILE AUDITOR
# ==========================================
with tab2:
    st.markdown("### 📂 Upload Your Own Articles File")
    st.markdown(
        "Upload a **CSV** or **TSV** file containing your own articles to audit in bulk. "
        "Your file should have a column for **Title** and/or **Content/Text**."
    )

    uploaded_file = st.file_uploader("Upload CSV / TSV file:", type=["csv", "tsv", "txt"])

    if uploaded_file is not None:
        try:
            df_upload = pd.read_csv(uploaded_file)
            st.success(f"Successfully loaded **{len(df_upload)}** rows.")
            st.dataframe(df_upload.head(4), use_container_width=True)

            col_sel1, col_sel2 = st.columns(2)
            with col_sel1:
                title_col_choice = st.selectbox(
                    "Select Title / Headline Column (Optional):",
                    options=["None"] + list(df_upload.columns),
                    index=0 if "title" not in [c.lower() for c in df_upload.columns] else [c.lower() for c in df_upload.columns].index("title") + 1,
                )
            with col_sel2:
                text_col_choice = st.selectbox(
                    "Select Article Body Column:",
                    options=list(df_upload.columns),
                    index=0 if "text" not in [c.lower() for c in df_upload.columns] else [c.lower() for c in df_upload.columns].index("text"),
                )

            if st.button("⚡ Run Batch Veracity Audit", type="primary"):
                progress_bar = st.progress(0)
                predictions = []
                confidences = []
                flags_list = []

                for idx, row in df_upload.iterrows():
                    row_title = str(row[title_col_choice]) if title_col_choice != "None" else ""
                    row_body = str(row[text_col_choice]) if pd.notna(row[text_col_choice]) else ""

                    try:
                        try:
                            res = system.predict_article(title=row_title, body=row_body, model_name=active_model)
                        except TypeError:
                            res = system.predict_article(f"{row_title} {row_body}".strip(), model_name=active_model)
                        conf_pct = res["confidence"] * 100
                        if conf_pct < 60.0:
                            verdict_lbl = "🟡 UNCERTAIN"
                        elif res["prediction_label"] == 1:
                            verdict_lbl = "🔴 LIKELY FAKE"
                        else:
                            verdict_lbl = "🟢 LIKELY REAL"
                        predictions.append(verdict_lbl)
                        confidences.append(f"{conf_pct:.0f}%")
                        flags_list.append("; ".join(res["suspicious_stylistic_flags"]) if res["suspicious_stylistic_flags"] else "None")
                    except Exception:
                        predictions.append("Error")
                        confidences.append("0%")
                        flags_list.append("Parse Error")

                    progress_bar.progress((idx + 1) / len(df_upload))

                df_result = df_upload.copy()
                df_result["Audit_Verdict"] = predictions
                df_result["Confidence"] = confidences
                df_result["Flagged_Anomalies"] = flags_list

                st.markdown("<div style='margin-top: 16px;'></div>", unsafe_allow_html=True)
                st.subheader("Audit Results Summary")
                fake_count = sum(1 for p in predictions if "FAKE" in p)
                real_count = sum(1 for p in predictions if "REAL" in p)
                uncertain_count = sum(1 for p in predictions if "UNCERTAIN" in p)

                stat1, stat2, stat3 = st.columns(3)
                stat1.metric("Flagged Fake (🔴)", fake_count)
                stat2.metric("Credible Real (🟢)", real_count)
                stat3.metric("Uncertain (🟡)", uncertain_count)

                st.dataframe(df_result, use_container_width=True)

                csv_buffer = io.StringIO()
                df_result.to_csv(csv_buffer, index=False)
                st.download_button(
                    label="📥 Download Audited CSV Report",
                    data=csv_buffer.getvalue(),
                    file_name="citadel_veracity_audit_report.csv",
                    mime="text/csv",
                )

        except Exception as e:
            st.error(f"Failed to read uploaded file: {e}")


# ==========================================
# TAB 3: MODEL BENCHMARKS
# ==========================================
with tab3:
    st.markdown("### 🏆 Algorithm Benchmark Performance")
    st.markdown(
        "Comparative metrics across all three supported classification engines on holdout evaluation data:"
    )

    if system.benchmark_results:
        records = []
        for name, metrics in system.benchmark_results.items():
            records.append({
                "Algorithm": name,
                "Accuracy": f"{metrics['accuracy']*100:.1f}%",
                "Precision": f"{metrics['precision']*100:.1f}%",
                "Recall": f"{metrics['recall']*100:.1f}%",
                "F1 Score": f"{metrics['f1_score']*100:.1f}%",
                "ROC-AUC": f"{metrics['roc_auc']:.4f}" if metrics.get("roc_auc") is not None else "N/A",
                "True Negatives": metrics["confusion_matrix"]["true_negatives"],
                "False Positives": metrics["confusion_matrix"]["false_positives"],
                "False Negatives": metrics["confusion_matrix"]["false_negatives"],
                "True Positives": metrics["confusion_matrix"]["true_positives"],
            })
        df_bench = pd.DataFrame(records)
        st.dataframe(df_bench, use_container_width=True)
    else:
        st.info("Run model training to populate evaluation statistics.")
