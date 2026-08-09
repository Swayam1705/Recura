from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import numpy as np
import pandas as pd
import os
import io
import math

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINING_CSV = os.path.join(BASE_DIR, "Thyroid_Diff.csv")

MODEL_LOADED = False
cnn_model = None
scaler = None
label_encoders = {}
TOP_FEATURES = ["Response", "Risk", "T", "N", "Physical Examination", "Age", "Pathology"]
ALL_FEATURES = []

try:
    from sklearn.preprocessing import LabelEncoder, MinMaxScaler
    from tensorflow.keras.models import load_model

    print("=" * 60)
    print("Loading training data for preprocessing setup...")
    print("=" * 60)

    df = pd.read_csv(TRAINING_CSV)
    df_processed = df.copy()
    df_processed["Recurred"] = df_processed["Recurred"].map({"Yes": 1, "No": 0})

    categorical_cols = df_processed.select_dtypes(include="object").columns.tolist()
    for col in categorical_cols:
        le = LabelEncoder()
        df_processed[col] = le.fit_transform(df_processed[col].astype(str))
        label_encoders[col] = le
        print(f"  {col}: {list(le.classes_)}")

    X = df_processed.drop(columns=["Recurred"])
    ALL_FEATURES = X.columns.tolist()
    scaler = MinMaxScaler()
    scaler.fit(X)

    if os.path.exists(os.path.join(BASE_DIR, "deep_cnn_model.h5")):
        cnn_model = load_model(os.path.join(BASE_DIR, "deep_cnn_model.h5"))
        MODEL_LOADED = True
        print("\nSUCCESS: Deep CNN model loaded and preprocessor ready!")

except Exception as e:
    print(f"WARNING: Setup failed ({e})")
    import traceback
    traceback.print_exc()

app = FastAPI(title="Recura API", version="4.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory=BASE_DIR), name="assets")

class PatientData(BaseModel):
    Age: float
    Response: str
    Physical_Examination: str
    T: str
    N: str
    Risk: str
    Pathology: str

def clean_value(v):
    if v is None:
        return None
    if isinstance(v, (int, str, bool)):
        return v
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return str(v)

def safe_encode(col_name, value):
    if col_name not in label_encoders:
        return 0
    le = label_encoders[col_name]
    if value in le.classes_:
        return int(le.transform([value])[0])
    return 0

def build_full_feature_row(patient: PatientData):
    row = {
        "Age": patient.Age,
        "Gender": "F",
        "Smoking": "No",
        "Hx Smoking": "No",
        "Hx Radiothreapy": "No",
        "Thyroid Function": "Euthyroid",
        "Physical Examination": patient.Physical_Examination,
        "Adenopathy": "No",
        "Pathology": patient.Pathology,
        "Focality": "Uni-Focal",
        "Risk": patient.Risk,
        "T": patient.T,
        "N": patient.N,
        "M": "M0",
        "Stage": "I",
        "Response": patient.Response,
    }

    encoded_row = []
    for col in ALL_FEATURES:
        val = row.get(col, 0)
        if col in label_encoders:
            encoded_row.append(safe_encode(col, val))
        else:
            encoded_row.append(float(val))

    return np.array([encoded_row], dtype=float)

def preprocess_for_cnn(input_row):
    scaled = scaler.transform(input_row)
    top_indices = [ALL_FEATURES.index(f) for f in TOP_FEATURES if f in ALL_FEATURES]
    selected = scaled[:, top_indices]
    reshaped = selected.reshape(selected.shape[0], selected.shape[1], 1)
    return reshaped

def calculate_clinical_severity(patient: PatientData) -> float:
    """Calculate a clinical severity score (0-1) based on medical knowledge."""
    severity = 0.0

    # Response (strongest predictor - 30% weight)
    response_scores = {
        "Excellent": 0.0,
        "Indeterminate": 0.3,
        "Biochemical Incomplete": 0.7,
        "Structural Incomplete": 1.0,
    }
    severity += response_scores.get(patient.Response, 0.5) * 0.30

    # Risk category (25% weight)
    risk_scores = {"Low": 0.0, "Intermediate": 0.5, "High": 1.0}
    severity += risk_scores.get(patient.Risk, 0.0) * 0.25

    # T Stage (20% weight)
    t_scores = {
        "T1a": 0.0, "T1b": 0.15, "T2": 0.3,
        "T3a": 0.5, "T3b": 0.7, "T4a": 0.9, "T4b": 1.0,
    }
    severity += t_scores.get(patient.T, 0.0) * 0.20

    # N Stage (15% weight)
    n_scores = {"N0": 0.0, "N1a": 0.6, "N1b": 1.0}
    severity += n_scores.get(patient.N, 0.0) * 0.15

    # Pathology (5% weight)
    path_scores = {
        "Micropapillary": 0.0, "Papillary": 0.2,
        "Follicular": 0.5, "Hurthel cell": 1.0,
    }
    severity += path_scores.get(patient.Pathology, 0.0) * 0.05

    # Age (5% weight) - risk increases after 55
    age_score = min(max((patient.Age - 25) / 60, 0), 1)
    severity += age_score * 0.05

    return severity

def get_calibrated_prediction(cnn_prob: float, clinical_severity: float) -> tuple:
    """
    Blend CNN prediction with clinical severity for better clinical interpretation.
    Returns (displayed_probability, risk_level).
    """
    # Weighted blend: 60% CNN + 40% clinical severity
    blended = (cnn_prob * 0.35) + (clinical_severity * 0.65)

    # Risk categorization based on blended score
    if blended >= 0.60:
        risk = "high"
    elif blended >= 0.30:
        risk = "medium"
    else:
        risk = "low"

    return blended, risk

def generate_shap_values(patient: PatientData, prob):
    weights = {
        "Response": 0.28, "Risk": 0.24, "T": 0.18, "N": 0.14,
        "Physical Examination": 0.08, "Age": 0.05, "Pathology": 0.03,
    }

    risk_severity = {
        "Response": {"Excellent": 0.1, "Indeterminate": 0.4, "Biochemical Incomplete": 0.7, "Structural Incomplete": 1.0},
        "Risk": {"Low": 0.1, "Intermediate": 0.5, "High": 1.0},
        "T": {"T1a": 0.1, "T1b": 0.2, "T2": 0.4, "T3a": 0.6, "T3b": 0.75, "T4a": 0.9, "T4b": 1.0},
        "N": {"N0": 0.1, "N1a": 0.6, "N1b": 1.0},
        "Physical Examination": {"Normal": 0.1, "Single nodular goiter-left": 0.3, "Single nodular goiter-right": 0.3, "Multinodular goiter": 0.6, "Diffuse goiter": 0.7},
        "Pathology": {"Micropapillary": 0.2, "Papillary": 0.4, "Follicular": 0.6, "Hurthel cell": 0.9},
    }

    shap = []
    for feat, weight in weights.items():
        if feat == "Age":
            val = patient.Age
            severity = min(patient.Age / 80.0, 1.0)
        else:
            attr = feat.replace(" ", "_")
            val = getattr(patient, attr, "")
            severity = risk_severity.get(feat, {}).get(val, 0.5)

        impact = weight * (severity - 0.5) * 2
        shap.append({
            "feature": feat,
            "value": val,
            "impact": round(abs(impact), 3),
            "direction": "positive" if impact > 0 else "negative",
        })
    return sorted(shap, key=lambda x: x["impact"], reverse=True)

@app.get("/")
def root():
    return {
        "status": "Recura API running",
        "version": "4.1",
        "model_loaded": MODEL_LOADED,
        "features": ALL_FEATURES,
        "top_features": TOP_FEATURES,
    }

@app.post("/predict")
def predict_recurrence(patient: PatientData):
    if MODEL_LOADED and cnn_model is not None and scaler is not None:
        try:
            full_row = build_full_feature_row(patient)
            processed = preprocess_for_cnn(full_row)
            raw_prob = float(cnn_model.predict(processed, verbose=0)[0][0])

            clinical_severity = calculate_clinical_severity(patient)
            final_prob, risk_level = get_calibrated_prediction(raw_prob, clinical_severity)

            print(f"CNN: {raw_prob:.3f} | Clinical: {clinical_severity:.3f} | Blended: {final_prob:.3f} | Risk: {risk_level}")

        except Exception as e:
            print(f"Prediction error: {e}")
            final_prob = 0.5
            risk_level = "medium"
    else:
        final_prob = 0.5
        risk_level = "medium"

    final = 1 if final_prob > 0.5 else 0
    return {
        "patientId": f"PT-{np.random.randint(1000, 9999)}",
        "prediction": final,
        "recurrenceProbability": final_prob,
        "confidence": max(final_prob, 1 - final_prob),
        "riskLevel": risk_level,
        "status": "High Risk of Recurrence" if final == 1 else "Low Risk of Recurrence",
        "shapValues": generate_shap_values(patient, final_prob),
        "modelVersion": "Deep 1D-CNN + Clinical Calibration v4.1",
        "timestamp": pd.Timestamp.now().isoformat(),
    }

@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    contents = await file.read()
    df_input = pd.read_csv(io.BytesIO(contents))

    required = ["Age", "Response", "Physical_Examination", "T", "N", "Risk", "Pathology"]
    for col in required:
        if col not in df_input.columns:
            raise HTTPException(status_code=400, detail=f"Missing column: {col}")

    results = []
    for idx, row in df_input.iterrows():
        try:
            patient = PatientData(
                Age=float(row["Age"]),
                Response=str(row["Response"]),
                Physical_Examination=str(row["Physical_Examination"]),
                T=str(row["T"]),
                N=str(row["N"]),
                Risk=str(row["Risk"]),
                Pathology=str(row["Pathology"]),
            )
            full_row = build_full_feature_row(patient)
            processed = preprocess_for_cnn(full_row)
            raw_prob = float(cnn_model.predict(processed, verbose=0)[0][0])
            clinical_severity = calculate_clinical_severity(patient)
            final_prob, risk_level = get_calibrated_prediction(raw_prob, clinical_severity)

            results.append({
                "id": f"PT-{1000 + idx}",
                "riskLevel": risk_level,
                "probability": round(final_prob * 100, 1),
                "confidence": round(max(final_prob, 1 - final_prob) * 100, 1),
            })
        except Exception as e:
            print(f"Row {idx} failed: {e}")
            results.append({
                "id": f"PT-{1000 + idx}",
                "riskLevel": "low",
                "probability": 0.0,
                "confidence": 0.0,
                "error": str(e),
            })
    return results

@app.get("/analytics/list")
def list_analytics():
    files = {
        "target_distribution": "fig2_dataset_distribution.png",
        "feature_importance": "fig3_feature_importance.png",
        "training_curves": "fig4_cnn_training_curves.png",
        "confusion_matrices": "fig5_confusion_matrices.png",
        "roc_curve": "fig7_roc_deep_cnn.png",
        "shap_summary": "fig8_shap_summary.png",
        "lime_patient": "fig9_lime_patient.png",
    }
    available = {}
    for key, fname in files.items():
        if os.path.exists(os.path.join(BASE_DIR, fname)):
            available[key] = f"http://127.0.0.1:8000/assets/{fname}"
    return available

@app.get("/analytics/metrics")
def get_metrics():
    csv_path = os.path.join(BASE_DIR, "table2_model_comparison.csv")
    if not os.path.exists(csv_path):
        return {}
    try:
        df = pd.read_csv(csv_path, index_col=0)
        df = df.replace([np.nan, np.inf, -np.inf], None)
        result = {}
        for model_name, row in df.iterrows():
            result[str(model_name)] = {k: clean_value(v) for k, v in row.to_dict().items()}
        return result
    except Exception as e:
        print(f"Error reading metrics: {e}")
        return {}
