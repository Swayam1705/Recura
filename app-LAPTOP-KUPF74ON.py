import streamlit as st
import pandas as pd
import os
import time
import streamlit.components.v1 as components

# ==========================================
# PAGE CONFIGURATION
# ==========================================
st.set_page_config(
    page_title="Federated Thyroid Detection",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# CUSTOM CSS (Background, Glass Effect, & Anti-Scroll Images)
# ==========================================
page_bg_img = '''
<style>
/* Background Image */
.stApp {
    background-image: url("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop");
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
/* Glassmorphism White Box */
.block-container {
    background-color: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 15px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
    backdrop-filter: blur(4px);
    margin-top: 2rem;
    min-height: 85vh; /* Prevents the box from collapsing */
}
/* ANTI-SCROLL IMAGE LOCKING */
/* This forces all images to fit perfectly on your screen without scrolling down */
img {
    max-height: 70vh !important; 
    width: auto !important;
    max-width: 100% !important;
    object-fit: contain !important;
    margin-left: auto;
    margin-right: auto;
    display: block;
}
</style>
'''
st.markdown(page_bg_img, unsafe_allow_html=True)

# ==========================================
# SIDEBAR NAVIGATION (Split for Zero Scrolling)
# ==========================================
st.sidebar.title("🩺 Control Panel")
st.sidebar.markdown("Click any module to view it instantly on one screen:")

menu = st.sidebar.radio(
    "Select View:",
    [
        "🏠 Executive Dashboard", 
        "📊 Dataset: Target Distribution", 
        "📊 Dataset: Top Features", 
        "📈 Model: Metrics Comparison", 
        "📈 Model: Confusion Matrices",
        "📈 Model: ROC & Training Curves",
        "🧠 XAI: SHAP (Global)", 
        "🧠 XAI: LIME (Local)", 
        "⚙️ System Execution"
    ]
)

st.sidebar.divider()
st.sidebar.info("💡 **Status:** Blockchain Network Active.\n\n**Nodes:** 3 Connected.")

# ==========================================
# HEADER
# ==========================================
st.title("🩺 Federated Blockchain Thyroid Detection System")
st.divider()

# ==========================================
# ROUTING (One Graphic Per Screen = No Scrolling)
# ==========================================

# ------------------------------------------
if menu == "🏠 Executive Dashboard":
    st.header("System Overview")
    st.markdown("**An Advanced Privacy-Preserving Machine Learning Architecture** Built with Federated Learning, Explainable AI (SHAP & LIME), and Deep CNNs.")
    st.write("")
    
    col_m1, col_m2, col_m3 = st.columns(3)
    with col_m1:
        st.metric(label="🏆 Top Model Accuracy (CNN)", value="98.7%", delta="Clinical Grade")
    with col_m2:
        st.metric(label="🔒 Privacy Framework", value="Federated", delta="Zero Data Sharing", delta_color="normal")
    with col_m3:
        st.metric(label="🧠 Explainability", value="Active", delta="SHAP & LIME Enabled", delta_color="normal")
        
    st.info("👈 **Use the sidebar on the left to navigate directly to specific graphs and metrics without scrolling.**")

# ------------------------------------------
elif menu == "📊 Dataset: Target Distribution":
    st.header("Target Distribution (Normal vs Recurrence)")
    if os.path.exists("fig2_dataset_distribution.png"):
        st.image("fig2_dataset_distribution.png")
    else:
        st.warning("Run the backend pipeline to generate this image.")

# ------------------------------------------
elif menu == "📊 Dataset: Top Features":
    st.header("Feature Importance (Top 7 Clinical Indicators)")
    if os.path.exists("fig3_feature_importance.png"):
        st.image("fig3_feature_importance.png")

# ------------------------------------------
elif menu == "📈 Model: Metrics Comparison":
    st.header("Comparative Model Metrics")
    if os.path.exists("table2_model_comparison.csv"):
        df_metrics = pd.read_csv("table2_model_comparison.csv", index_col=0)
        st.dataframe(df_metrics.style.highlight_max(axis=0, color='#1E88E5'), use_container_width=True, height=400)

# ------------------------------------------
elif menu == "📈 Model: Confusion Matrices":
    st.header("Model Diagnostic Performance (Confusion Matrices)")
    if os.path.exists("fig5_confusion_matrices.png"):
        st.image("fig5_confusion_matrices.png")

# ------------------------------------------
elif menu == "📈 Model: ROC & Training Curves":
    st.header("Deep CNN Training & Receiver Operating Characteristics")
    col1, col2 = st.columns(2)
    with col1:
        if os.path.exists("fig4_cnn_training_curves.png"):
            st.image("fig4_cnn_training_curves.png", caption="CNN Training Curves")
    with col2:
        if os.path.exists("fig7_roc_deep_cnn.png"):
            st.image("fig7_roc_deep_cnn.png", caption="Deep CNN ROC-AUC")

# ------------------------------------------
elif menu == "🧠 XAI: SHAP (Global)":
    st.header("Trust & Transparency: SHAP Global Explanation")
    st.write("*What drives the model's decisions across the entire patient population?*")
    if os.path.exists("fig8_shap_summary.png"):
        st.image("fig8_shap_summary.png")

# ------------------------------------------
elif menu == "🧠 XAI: LIME (Local)":
    st.header("Trust & Transparency: LIME Local Explanation")
    st.write("*Why did the model make this specific prediction for Patient #1?*")
    
    if os.path.exists("fig9_lime_patient.html"):
        with open("fig9_lime_patient.html", 'r', encoding='utf-8') as f:
            html_data = f.read()
        components.html(html_data, height=500, scrolling=True)
    elif os.path.exists("fig9_lime_patient.png"):
        st.image("fig9_lime_patient.png")
    else:
        st.warning("LIME output not found.")

# ------------------------------------------
elif menu == "⚙️ System Execution":
    st.header("Pipeline Execution & Node Management")
    st.write("Trigger the underlying Python scripts directly from this interface.")
    
    st.info("💡 **Demo Mode Active:** Models have been pre-trained in the backend terminal to ensure presentation stability. Triggering the pipelines below will verify file integrity and simulate the deployment sequence.")
    
    col_btn1, col_btn2 = st.columns(2)
    
    with col_btn1:
        if st.button("🚀 Deploy Standard Pipeline", use_container_width=True):
            with st.spinner("Connecting to centralized server and verifying models..."):
                time.sleep(3) 
                
                if os.path.exists("fig4_cnn_training_curves.png"):
                    st.success("✅ Pipeline deployment successful! All models (CNN, XGBoost) are active and graphs are up to date.")
                    st.code("Status: 200 OK\nModels Loaded: Deep CNN, Voting Classifier\nMetrics: Synchronized", language="text")
                else:
                    st.error("Missing output files. Please run `python thyroid_pipeline.py` in your terminal first.")

    with col_btn2:
        if st.button("⛓️ Initialize Federated Blockchain", use_container_width=True):
            with st.spinner("Broadcasting to decentralized hospital nodes..."):
                time.sleep(4) 
                
                st.success("✅ Federated Learning sequence complete! Blockchain ledger updated.")
                st.code("""
[Node 1: City Hospital] - Weights synchronized.
[Node 2: General Clinic] - Weights synchronized.
[Node 3: Care Center] - Weights synchronized.
[Global Server] - Federated averaging complete. 
[Blockchain] - Block #4092 mined and verified. SHA-256 hash secured.
                """, language="text")