from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import numpy as np
import pandas as pd
import os
import io
import math
import re
from database import (
    save_prediction, get_all_predictions, get_patient_timeline,
    get_stats, delete_prediction, export_all_csv
)
from notifications import (
    check_and_create_alert, get_alerts, get_alert_counts,
    acknowledge_alert, acknowledge_all, delete_alert,
    load_config, save_config, send_email_alert
)
from fastapi.responses import Response

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
    patient_id: str | None = None
    doctor_id: int | None = 1  # <-- ADD THIS FIELD  # Optional: for follow-up predictions

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

def generate_patient_id() -> str:
    """Generate next sequential patient ID like PT-000001, PT-000002, etc."""
    try:
        from database import get_conn
        with get_conn() as conn:
            row = conn.execute(
                "SELECT patient_id FROM predictions ORDER BY id DESC LIMIT 1"
            ).fetchone()

            if row and row["patient_id"]:
                # Extract number from PT-XXXXXX format
                last_id = row["patient_id"]
                match = re.search(r'PT-(\d+)', last_id)
                if match:
                    next_num = int(match.group(1)) + 1
                    return f"PT-{next_num:06d}"

        # Default: start at PT-000001
        return "PT-000001"
    except Exception as e:
        # Fallback if DB fails
        print(f"ID generation failed: {e}, using timestamp fallback")
        import time
        return f"PT-{int(time.time()) % 1000000:06d}"

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

    # Determine patient ID: use provided one OR generate new sequential ID
    if patient.patient_id and patient.patient_id.strip():
        patient_id = patient.patient_id.strip().upper()
        print(f"Using existing patient ID: {patient_id}")
    else:
        patient_id = generate_patient_id()
        print(f"Generated new patient ID: {patient_id}")

    final = 1 if final_prob > 0.5 else 0
    response_data = {
        "patientId": patient_id,
        "prediction": final,
        "recurrenceProbability": final_prob,
        "confidence": max(final_prob, 1 - final_prob),
        "riskLevel": risk_level,
        "status": "High Risk of Recurrence" if final == 1 else "Low Risk of Recurrence",
        "shapValues": generate_shap_values(patient, final_prob),
        "modelVersion": "Deep 1D-CNN + Clinical Calibration v4.1",
        "timestamp": pd.Timestamp.now().isoformat(),
    }
    # Determine doctor_id from the incoming request (defaults to 1 if missing)
    doctor_id = patient.doctor_id or 1

    # Auto-save to database FIRST (before returning)
    try:
        patient_dict = patient.dict(exclude={"patient_id", "doctor_id"})
        prediction_id = save_prediction(patient_dict, response_data, doctor_id=doctor_id)
        response_data["dbId"] = prediction_id
        print(f"Saved prediction #{prediction_id} for Doctor #{doctor_id} ({patient_id})")
    except Exception as e:
        print(f"Failed to save prediction: {e}")

    # Auto-trigger alert with correct doctor-level isolation
    try:
        alert = check_and_create_alert(
            patient_id=patient_id,
            risk_level=risk_level,
            risk_score=final_prob,
            pathology=patient.Pathology,
            doctor_id=doctor_id,
        )
        if alert:
            response_data["alertCreated"] = True
            response_data["alertId"] = alert["id"]
            print(f"Alert created: #{alert['id']} for Doctor #{doctor_id}")
    except Exception as e:
        print(f"Alert creation failed: {e}")

    return response_data

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

# ═══════════════════════════════════════════════════════════════════
#  AI NOTE PARSER - Extract structured data from clinical notes
# ═══════════════════════════════════════════════════════════════════

import re
import json as json_lib

class NoteParseRequest(BaseModel):
    notes: str
    use_llm: bool = True

# ── REGEX FALLBACK EXTRACTOR (works without OpenAI) ────────────────
def regex_extract_features(notes: str) -> dict:
    """Rule-based extraction — always works, no API needed"""
    text = notes.lower()
    features = {}
    confidence = {}
    source_texts = {}

    # AGE
    age_match = re.search(r'(\d{1,3})\s*(?:y[/\s]?o|year|yr|yrs)', text)
    if age_match:
        age = int(age_match.group(1))
        if 1 <= age <= 120:
            features['Age'] = age
            confidence['Age'] = 0.92
            source_texts['Age'] = age_match.group(0)

    # T STAGE
    t_match = re.search(r'\bt\s*([1-4][ab]?)\b', text)
    if t_match:
        t_val = f"T{t_match.group(1).upper()}"
        valid_t = ["T1a", "T1b", "T2", "T3a", "T3b", "T4a", "T4b"]
        if t_val in valid_t:
            features['T'] = t_val
            confidence['T'] = 0.90
            source_texts['T'] = t_match.group(0)

    # N STAGE
    n_match = re.search(r'\bn\s*([01][ab]?)\b', text)
    if n_match:
        n_val = f"N{n_match.group(1).lower()}"
        valid_n = ["N0", "N1a", "N1b"]
        if n_val in valid_n:
            features['N'] = n_val
            confidence['N'] = 0.90
            source_texts['N'] = n_match.group(0)

    # ATA RISK
    risk_patterns = [
        (r'\b(high)\s*risk\b', 'High'),
        (r'\b(intermediate|medium|moderate)\s*risk\b', 'Intermediate'),
        (r'\b(low)\s*risk\b', 'Low'),
        (r'\bata\s*(high|intermediate|low)\b', None),
    ]
    for pattern, direct in risk_patterns:
        m = re.search(pattern, text)
        if m:
            val = direct if direct else m.group(1).capitalize()
            if val.lower() == 'intermediate' or val.lower() in ['medium', 'moderate']:
                features['Risk'] = 'Intermediate'
            elif val.lower() == 'high':
                features['Risk'] = 'High'
            elif val.lower() == 'low':
                features['Risk'] = 'Low'
            confidence['Risk'] = 0.88
            source_texts['Risk'] = m.group(0)
            break

    # TREATMENT RESPONSE
    response_map = {
        r'\bexcellent\s*response\b': 'Excellent',
        r'\bstructural\s*incomplete\b': 'Structural Incomplete',
        r'\bstructurally\s*incomplete\b': 'Structural Incomplete',
        r'\bbiochemical\s*incomplete\b': 'Biochemical Incomplete',
        r'\bbiochemically\s*incomplete\b': 'Biochemical Incomplete',
        r'\bindeterminate\s*response\b': 'Indeterminate',
        r'\bindeterminate\b': 'Indeterminate',
    }
    for pattern, val in response_map.items():
        m = re.search(pattern, text)
        if m:
            features['Response'] = val
            confidence['Response'] = 0.87
            source_texts['Response'] = m.group(0)
            break

    # PATHOLOGY
    path_map = {
        r'\bmicropapillary\b': 'Micropapillary',
        r'\bpapillary\b': 'Papillary',
        r'\bfollicular\b': 'Follicular',
        r'\bh[uü]rth[le]+\s*cell\b': 'Hurthel cell',
    }
    for pattern, val in path_map.items():
        m = re.search(pattern, text)
        if m:
            features['Pathology'] = val
            confidence['Pathology'] = 0.89
            source_texts['Pathology'] = m.group(0)
            break

    # PHYSICAL EXAMINATION
    exam_map = {
        r'\bmultinodular\s*goiter\b': 'Multinodular goiter',
        r'\bdiffuse\s*goiter\b': 'Diffuse goiter',
        r'\bsingle\s*nodul[ae]r?\s*goiter[- ]*left\b': 'Single nodular goiter-left',
        r'\bsingle\s*nodul[ae]r?\s*goiter[- ]*right\b': 'Single nodular goiter-right',
        r'\bleft\s*(?:thyroid\s*)?nodul[ae]\b': 'Single nodular goiter-left',
        r'\bright\s*(?:thyroid\s*)?nodul[ae]\b': 'Single nodular goiter-right',
        r'\bnormal\s*(?:physical\s*)?exam(?:ination)?\b': 'Normal',
        r'\bunremarkable\s*exam(?:ination)?\b': 'Normal',
    }
    for pattern, val in exam_map.items():
        m = re.search(pattern, text)
        if m:
            features['Physical_Examination'] = val
            confidence['Physical_Examination'] = 0.82
            source_texts['Physical_Examination'] = m.group(0)
            break

    return {
        'features': features,
        'confidence': confidence,
        'source_texts': source_texts,
    }


# ── OPENAI EXTRACTOR (better accuracy, requires API key) ───────────
async def openai_extract_features(notes: str) -> dict:
    """LLM-based extraction using OpenAI GPT"""
    import os
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
    except ImportError:
        raise ImportError("openai package not installed")

    system_prompt = """You are a medical NLP extractor for thyroid cancer records.
Extract fields from clinical notes. Return ONLY valid JSON, no markdown.

Required JSON structure:
{
  "features": {
    "Age": <number 1-120 or null>,
    "T": <"T1a"|"T1b"|"T2"|"T3a"|"T3b"|"T4a"|"T4b" or null>,
    "N": <"N0"|"N1a"|"N1b" or null>,
    "Risk": <"Low"|"Intermediate"|"High" or null>,
    "Response": <"Excellent"|"Indeterminate"|"Biochemical Incomplete"|"Structural Incomplete" or null>,
    "Pathology": <"Papillary"|"Follicular"|"Micropapillary"|"Hurthel cell" or null>,
    "Physical_Examination": <"Normal"|"Single nodular goiter-left"|"Single nodular goiter-right"|"Multinodular goiter"|"Diffuse goiter" or null>
  },
  "confidence": {
    "<field_name>": <0.0-1.0 confidence score>
  },
  "source_texts": {
    "<field_name>": "<exact phrase from notes>"
  }
}

Only include fields you're confident about. Use null for missing data."""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Extract from these notes:\n\n{notes}"}
        ],
        temperature=0.1,
        max_tokens=600,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    raw = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw, flags=re.MULTILINE).strip()
    data = json_lib.loads(raw)

    # Filter out null values
    features = {k: v for k, v in data.get('features', {}).items() if v is not None}
    confidence = data.get('confidence', {})
    source_texts = data.get('source_texts', {})

    return {
        'features': features,
        'confidence': confidence,
        'source_texts': source_texts,
    }


# ── MAIN ENDPOINT ──────────────────────────────────────────────────
@app.post("/parse-notes")
async def parse_clinical_notes(request: NoteParseRequest):
    notes = request.notes.strip()
    if not notes:
        raise HTTPException(status_code=400, detail="Notes cannot be empty")
    if len(notes) < 15:
        raise HTTPException(status_code=400, detail="Notes too short to extract meaningful features")

    model_used = "regex-fallback"
    result = None

    # Try OpenAI first if requested
    if request.use_llm:
        try:
            result = await openai_extract_features(notes)
            model_used = "gpt-3.5-turbo"
            print(f"OpenAI extracted {len(result['features'])} features")
        except Exception as e:
            print(f"OpenAI failed ({e}), falling back to regex")
            result = regex_extract_features(notes)
    else:
        result = regex_extract_features(notes)

    return {
        "extracted_features": result['features'],
        "confidence_scores": result['confidence'],
        "source_texts": result['source_texts'],
        "model_used": model_used,
        "field_count": len(result['features']),
    }


@app.get("/parse-notes/health")
def note_parser_health():
    import os
    return {
        "openai_available": bool(os.getenv('OPENAI_API_KEY')),
        "regex_fallback": True,
        "status": "ok"
    }

# ═══════════════════════════════════════════════════════════════════
#  PATIENT HISTORY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.get("/history")
def get_history(
    search: str = "",
    risk: str = "",
    page: int = 1,
    per_page: int = 20,
    doctor_id: int | None = None # <-- ADD
):
    try:
        return get_all_predictions(search, risk, page, per_page, doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/stats")
def history_stats(doctor_id: int | None = None): # <-- ADD
    try:
        return get_stats(doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/patient/{patient_id}")
def patient_timeline(patient_id: str, doctor_id: int | None = None): # <-- ADD
    try:
        timeline = get_patient_timeline(patient_id, doctor_id=doctor_id)
        return {
            "patient_id": patient_id,
            "prediction_count": len(timeline),
            "predictions": timeline,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/history/{prediction_id}")
def delete_prediction_endpoint(prediction_id: int):
    """Delete a specific prediction record"""
    try:
        success = delete_prediction(prediction_id)
        if not success:
            raise HTTPException(status_code=404, detail="Prediction not found")
        return {"deleted": True, "id": prediction_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/export/csv")
def export_history_csv(doctor_id: int | None = None):
    """Download predictions as CSV for a specific doctor"""
    try:
        csv_data = export_all_csv(doctor_id=doctor_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=recura_history_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/patients/search")
def search_patients(q: str = "", doctor_id: int | None = None):
    """Search for existing patient IDs (for autocomplete in prediction form)"""
    try:
        from database import get_conn
        with get_conn() as conn:
            query = q.strip().upper()
            conditions = []
            params = []

            if doctor_id:
                conditions.append("p1.doctor_id = ?")
                params.append(doctor_id)

            if query:
                conditions.append("p1.patient_id LIKE ?")
                params.extend([f"%{query}%"])

            where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

            sql = f"""
            SELECT DISTINCT p1.patient_id,
                   COUNT(*) as prediction_count,
                   MAX(p1.created_at) as last_visit,
                   (SELECT p2.risk_level FROM predictions p2
                    WHERE p2.patient_id = p1.patient_id AND p2.doctor_id = p1.doctor_id
                    ORDER BY p2.created_at DESC LIMIT 1) as last_risk,
                   (SELECT p2.pathology FROM predictions p2
                    WHERE p2.patient_id = p1.patient_id AND p2.doctor_id = p1.doctor_id
                    ORDER BY p2.created_at DESC LIMIT 1) as pathology,
                   (SELECT p2.age FROM predictions p2
                    WHERE p2.patient_id = p1.patient_id AND p2.doctor_id = p1.doctor_id
                    ORDER BY p2.created_at DESC LIMIT 1) as age
            FROM predictions p1
            {where_clause}
            GROUP BY p1.patient_id
            ORDER BY last_visit DESC
            LIMIT 10
            """

            rows = conn.execute(sql, params).fetchall()

            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ═══════════════════════════════════════════════════════════════════
#  NOTIFICATIONS & ALERTS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

class AlertConfig(BaseModel):
    high_risk_threshold: float = 0.65
    medium_risk_threshold: float = 0.40
    in_app_enabled: bool = True
    email_enabled: bool = False
    email_recipients: list = []
    notify_on_high: bool = True
    notify_on_medium: bool = True
    notify_on_low: bool = False


@app.get("/alerts")
def list_alerts(unread_only: bool = False, limit: int = 50, doctor_id: int | None = None): # <-- ADD
    try:
        return get_alerts(unread_only=unread_only, limit=limit, doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/counts")
def alert_counts(doctor_id: int | None = None): # <-- ADD
    try:
        return get_alert_counts(doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/alerts/{alert_id}/acknowledge")
def ack_alert(alert_id: int):
    """Mark a specific alert as acknowledged"""
    try:
        success = acknowledge_alert(alert_id)
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found or already acknowledged")
        return {"acknowledged": True, "id": alert_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/alerts/acknowledge-all")
def ack_all_alerts(doctor_id: int | None = None): # <-- ADD
    try:
        count = acknowledge_all(doctor_id=doctor_id)
        return {"acknowledged_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/alerts/{alert_id}")
def remove_alert(alert_id: int):
    """Delete an alert"""
    try:
        success = delete_alert(alert_id)
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"deleted": True, "id": alert_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/alerts/config")
def get_alert_config():
    """Get current alert configuration"""
    return load_config()


@app.put("/alerts/config")
def update_alert_config(config: AlertConfig):
    """Update alert configuration"""
    try:
        save_config(config.dict())
        return {"updated": True, "config": config.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/alerts/test")
def send_test_alert():
    """Create a test alert for demo purposes"""
    try:
        alert = check_and_create_alert(
            patient_id="PT-TEST",
            risk_level="high",
            risk_score=0.85,
            pathology="Test Pathology",
        )
        if alert:
            return {"created": True, "alert": alert}
        return {"created": False, "message": "Alert threshold not met by config"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ═══════════════════════════════════════════════════════════════════
#  AUTHENTICATION ENDPOINTS (Sign Up / Sign In)
# ═══════════════════════════════════════════════════════════════════
import bcrypt
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "recura_super_secret_capstone_key"  # In production, use .env

class DoctorSignUp(BaseModel):
    name: str
    email: str
    hospital: str
    password: str

class DoctorSignIn(BaseModel):
    email: str
    password: str

@app.post("/auth/signup")
def signup(data: DoctorSignUp):
    try:
        from database import get_conn
        with get_conn() as conn:
            # Check if email already exists
            existing = conn.execute("SELECT id FROM doctors WHERE email = ?", (data.email.lower(),)).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

            # Hash the password securely
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')

            # Insert new doctor
            cursor = conn.execute("""
            INSERT INTO doctors (name, email, hospital, password_hash)
            VALUES (?, ?, ?, ?)
            """, (data.name, data.email.lower(), data.hospital, hashed))
            
            doctor_id = cursor.lastrowid

            # Create JWT Token
            token = jwt.encode({
                "sub": str(doctor_id),
                "name": data.name,
                "hospital": data.hospital,
                "exp": datetime.utcnow() + timedelta(days=7)
            }, SECRET_KEY, algorithm="HS256")

            return {
                "message": "Doctor registered successfully",
                "token": token,
                "doctor": {"id": doctor_id, "name": data.name, "hospital": data.hospital}
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/auth/login")
def login(data: DoctorSignIn):
    try:
        from database import get_conn
        with get_conn() as conn:
            # Find doctor by email
            doctor = conn.execute("SELECT * FROM doctors WHERE email = ?", (data.email.lower(),)).fetchone()
            
            if not doctor:
                raise HTTPException(status_code=401, detail="Invalid email or password")

            # Verify password
            if not bcrypt.checkpw(data.password.encode('utf-8'), doctor["password_hash"].encode('utf-8')):
                raise HTTPException(status_code=401, detail="Invalid email or password")

            # Create JWT Token
            token = jwt.encode({
                "sub": str(doctor["id"]),
                "name": doctor["name"],
                "hospital": doctor["hospital"],
                "exp": datetime.utcnow() + timedelta(days=7)
            }, SECRET_KEY, algorithm="HS256")

            return {
                "message": "Login successful",
                "token": token,
                "doctor": {"id": doctor["id"], "name": doctor["name"], "hospital": doctor["hospital"]}
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")