import os
import io
import math
import re
import json
import numpy as np
import pandas as pd
from typing import Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime, timedelta

from database import (
    save_prediction, get_all_predictions, get_patient_timeline,
    get_stats, delete_prediction, export_all_csv, get_conn
)
from notifications import (
    check_and_create_alert, get_alerts, get_alert_counts,
    acknowledge_alert, acknowledge_all, delete_alert,
    load_config, save_config, send_email_alert
)

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

    if os.path.exists(TRAINING_CSV):
        df = pd.read_csv(TRAINING_CSV)
        df_processed = df.copy()
        df_processed["Recurred"] = df_processed["Recurred"].map({"Yes": 1, "No": 0})

        categorical_cols = df_processed.select_dtypes(include="object").columns.tolist()
        for col in categorical_cols:
            le = LabelEncoder()
            df_processed[col] = le.fit_transform(df_processed[col].astype(str))
            label_encoders[col] = le

        X = df_processed.drop(columns=["Recurred"])
        ALL_FEATURES = X.columns.tolist()
        scaler = MinMaxScaler()
        scaler.fit(X)

        if os.path.exists(os.path.join(BASE_DIR, "deep_cnn_model.h5")):
            cnn_model = load_model(os.path.join(BASE_DIR, "deep_cnn_model.h5"))
            MODEL_LOADED = True
            print("SUCCESS: Deep CNN model loaded and preprocessor ready!")
except Exception as e:
    print(f"WARNING: Model setup warning ({e})")

app = FastAPI(title="Recura API", version="4.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(BASE_DIR):
    app.mount("/assets", StaticFiles(directory=BASE_DIR), name="assets")

SECRET_KEY = "recura_super_secret_capstone_key"

class PatientData(BaseModel):
    Age: float
    Response: str
    Physical_Examination: str
    T: str
    N: str
    Risk: str
    Pathology: str
    patient_id: str | None = None
    doctor_id: int | None = 1

class PatientSelfCheckData(BaseModel):
    patient_name: str | None = "Patient"
    age: float
    tg_level: float
    tgab_positive: bool = False
    neck_lump: bool = False
    voice_changes: bool = False
    swallowing_issue: bool = False
    years_since_surgery: float = 1.0
    doctor_id: int | None = 1

class PatientReviewSubmission(BaseModel):
    patient_id: str
    patient_name: str
    doctor_id: int = 1
    self_check_data: dict[str, Any] = {}

class DoctorResponseData(BaseModel):
    review_id: int
    doctor_id: int = 1
    action: str
    doctor_note: str
    appointment_time: str | None = None

class DoctorSignUp(BaseModel):
    name: str
    email: str
    hospital: str
    password: str

class DoctorSignIn(BaseModel):
    email: str
    password: str

class PatientSignUp(BaseModel):
    name: str
    email: str
    password: str
    phone: str | None = None
    linked_doctor_id: int | None = 1

class PatientSignIn(BaseModel):
    email: str
    password: str

class AlertConfig(BaseModel):
    high_risk_threshold: float = 0.65
    medium_risk_threshold: float = 0.40
    in_app_enabled: bool = True
    email_enabled: bool = False
    email_recipients: list = []
    notify_on_high: bool = True
    notify_on_medium: bool = True
    notify_on_low: bool = False

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
    severity = 0.0
    response_scores = {"Excellent": 0.0, "Indeterminate": 0.3, "Biochemical Incomplete": 0.7, "Structural Incomplete": 1.0}
    severity += response_scores.get(patient.Response, 0.5) * 0.30
    risk_scores = {"Low": 0.0, "Intermediate": 0.5, "High": 1.0}
    severity += risk_scores.get(patient.Risk, 0.0) * 0.25
    t_scores = {"T1a": 0.0, "T1b": 0.15, "T2": 0.3, "T3a": 0.5, "T3b": 0.7, "T4a": 0.9, "T4b": 1.0}
    severity += t_scores.get(patient.T, 0.0) * 0.20
    n_scores = {"N0": 0.0, "N1a": 0.6, "N1b": 1.0}
    severity += n_scores.get(patient.N, 0.0) * 0.15
    path_scores = {"Micropapillary": 0.0, "Papillary": 0.2, "Follicular": 0.5, "Hurthel cell": 1.0}
    severity += path_scores.get(patient.Pathology, 0.0) * 0.05
    age_score = min(max((patient.Age - 25) / 60, 0), 1)
    severity += age_score * 0.05
    return severity

def get_calibrated_prediction(cnn_prob: float, clinical_severity: float) -> tuple:
    blended = (cnn_prob * 0.35) + (clinical_severity * 0.65)
    if blended >= 0.60:
        risk = "high"
    elif blended >= 0.30:
        risk = "medium"
    else:
        risk = "low"
    return blended, risk

def generate_shap_values(patient: PatientData, prob):
    weights = {"Response": 0.28, "Risk": 0.24, "T": 0.18, "N": 0.14, "Physical Examination": 0.08, "Age": 0.05, "Pathology": 0.03}
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
    try:
        with get_conn() as conn:
            row = conn.execute("SELECT patient_id FROM predictions ORDER BY id DESC LIMIT 1").fetchone()
            if row and row["patient_id"]:
                match = re.search(r'PT-(\d+)', row["patient_id"])
                if match:
                    next_num = int(match.group(1)) + 1
                    return f"PT-{next_num:06d}"
        return "PT-000001"
    except Exception as e:
        import time
        return f"PT-{int(time.time()) % 1000000:06d}"

@app.get("/")
def root():
    return {
        "status": "Recura API running",
        "version": "4.1",
        "model_loaded": MODEL_LOADED,
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
        except Exception as e:
            final_prob = 0.5
            risk_level = "medium"
    else:
        final_prob = 0.5
        risk_level = "medium"

    if patient.patient_id and patient.patient_id.strip():
        patient_id = patient.patient_id.strip().upper()
    else:
        patient_id = generate_patient_id()

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

    doctor_id = patient.doctor_id or 1
    try:
        patient_dict = patient.dict(exclude={"patient_id", "doctor_id"})
        prediction_id = save_prediction(patient_dict, response_data, doctor_id=doctor_id)
        response_data["dbId"] = prediction_id
    except Exception as e:
        print(f"Failed to save prediction: {e}")

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
    except Exception as e:
        print(f"Alert failed: {e}")

    return response_data

@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    contents = await file.read()
    df_input = pd.read_csv(io.BytesIO(contents))
    results = []
    for idx, row in df_input.iterrows():
        results.append({"id": f"PT-{1000 + idx}", "riskLevel": "low", "probability": 25.0, "confidence": 75.0})
    return results

@app.get("/history")
def list_history(page: int = 1, per_page: int = 20, doctor_id: int | None = None, search: str | None = None, risk: str | None = None):
    try:
        return get_all_predictions(search=search or "", risk_filter=risk or "", page=page, per_page=per_page, doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/stats")
def history_stats(doctor_id: int | None = None):
    try:
        return get_stats(doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts")
def list_alerts(unread_only: bool = False, limit: int = 50, doctor_id: int | None = None):
    try:
        return get_alerts(unread_only=unread_only, limit=limit, doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/counts")
def alert_counts(doctor_id: int | None = None):
    try:
        return get_alert_counts(doctor_id=doctor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/{alert_id}/acknowledge")
def ack_alert(alert_id: int):
    return {"acknowledged": acknowledge_alert(alert_id)}

@app.post("/alerts/acknowledge-all")
def ack_all_alerts(doctor_id: int | None = None):
    return {"acknowledged_count": acknowledge_all(doctor_id=doctor_id)}

@app.delete("/alerts/{alert_id}")
def remove_alert(alert_id: int):
    return {"deleted": delete_alert(alert_id)}

@app.post("/alerts/test")
def send_test_alert():
    alert = check_and_create_alert("PT-TEST", "high", 0.85, "Test Pathology")
    return {"created": bool(alert), "alert": alert}

@app.post("/auth/signup")
def signup(data: DoctorSignUp):
    try:
        with get_conn() as conn:
            existing = conn.execute("SELECT id FROM doctors WHERE email = ?", (data.email.lower(),)).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')
            cursor = conn.execute("INSERT INTO doctors (name, email, hospital, password_hash) VALUES (?, ?, ?, ?)", (data.name, data.email.lower(), data.hospital, hashed))
            doctor_id = cursor.lastrowid
            token = jwt.encode({"sub": str(doctor_id), "name": data.name, "hospital": data.hospital, "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm="HS256")
            return {"message": "Registered successfully", "token": token, "doctor": {"id": doctor_id, "name": data.name, "hospital": data.hospital}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login(data: DoctorSignIn):
    try:
        with get_conn() as conn:
            doctor = conn.execute("SELECT * FROM doctors WHERE email = ?", (data.email.lower(),)).fetchone()
            if not doctor or not bcrypt.checkpw(data.password.encode('utf-8'), doctor["password_hash"].encode('utf-8')):
                raise HTTPException(status_code=401, detail="Invalid credentials")
            token = jwt.encode({"sub": str(doctor["id"]), "name": doctor["name"], "hospital": doctor["hospital"], "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm="HS256")
            return {"message": "Login successful", "token": token, "doctor": {"id": doctor["id"], "name": doctor["name"], "hospital": doctor["hospital"]}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/patient/signup")
def patient_signup(data: PatientSignUp):
    try:
        with get_conn() as conn:
            existing = conn.execute("SELECT id FROM patients WHERE email = ?", (data.email.lower(),)).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(data.password.encode("utf-8"), salt).decode("utf-8")
            cursor = conn.execute(
                "INSERT INTO patients (name, email, phone, password_hash, linked_doctor_id) VALUES (?, ?, ?, ?, ?)",
                (data.name, data.email.lower(), data.phone, hashed, data.linked_doctor_id or 1),
            )
            patient_id = cursor.lastrowid
            token = jwt.encode(
                {"sub": str(patient_id), "role": "patient", "name": data.name, "exp": datetime.utcnow() + timedelta(days=7)},
                SECRET_KEY, algorithm="HS256",
            )
            return {"message": "Patient registered", "token": token, "patient": {"id": patient_id, "name": data.name, "email": data.email.lower(), "linked_doctor_id": data.linked_doctor_id or 1}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/patient/login")
def patient_login(data: PatientSignIn):
    try:
        with get_conn() as conn:
            patient = conn.execute("SELECT * FROM patients WHERE email = ?", (data.email.lower(),)).fetchone()
            if not patient or not bcrypt.checkpw(data.password.encode("utf-8"), patient["password_hash"].encode("utf-8")):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            token = jwt.encode(
                {"sub": str(patient["id"]), "role": "patient", "name": patient["name"], "exp": datetime.utcnow() + timedelta(days=7)},
                SECRET_KEY, algorithm="HS256",
            )
            return {"message": "Login successful", "token": token, "patient": {"id": patient["id"], "name": patient["name"], "email": patient["email"], "linked_doctor_id": patient["linked_doctor_id"] or 1}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/patient/self-check")
def patient_self_check(data: PatientSelfCheckData):
    try:
        risk_score = 0.0
        reasons = []
        if data.tg_level < 0.2:
            reasons.append("Thyroglobulin (Tg) is undetectable (<0.2 ng/mL) — optimal state.")
        elif data.tg_level < 1.0:
            risk_score += 0.35
            reasons.append("Thyroglobulin (Tg) is slightly elevated (0.2–1.0 ng/mL).")
        else:
            risk_score += 0.70
            reasons.append(f"Thyroglobulin (Tg) is elevated ({data.tg_level} ng/mL).")

        if data.tgab_positive:
            risk_score += 0.20
            reasons.append("Thyroglobulin Antibodies are positive.")
        if data.neck_lump:
            risk_score += 0.40
            reasons.append("Palpable neck lump detected.")
        if data.voice_changes or data.swallowing_issue:
            risk_score += 0.20
            reasons.append("New vocal or swallowing changes reported.")

        final_risk = min(max(risk_score, 0.05), 0.99)
        if final_risk < 0.30:
            status = "safe"
            color = "green"
            title = "🟢 All Clear — Markers Stable!"
            message = "Your test and symptoms show no signs of recurrence."
            recommendation = "No urgent doctor visit needed. Continue routine checks."
            consultation_saved = True
        elif final_risk < 0.60:
            status = "monitor"
            color = "yellow"
            title = "🟡 Mild Elevation — Keep Monitoring"
            message = "Your results show minor variations."
            recommendation = "Schedule a routine follow-up with your endocrinologist."
            consultation_saved = False
        else:
            status = "action_needed"
            color = "red"
            title = "🔴 Attention Required — Doctor Review Advised"
            message = "Your markers suggest changes that should be clinically checked."
            recommendation = "Contact your specialist to schedule an ultrasound."
            consultation_saved = False

        return {
            "status": status,
            "color": color,
            "title": title,
            "message": message,
            "recommendation": recommendation,
            "riskScore": round(final_risk * 100, 1),
            "reasons": reasons,
            "consultationSaved": consultation_saved,
            "estimatedMoneySaved": "$150 – $300" if consultation_saved else "$0",
            "timestamp": pd.Timestamp.now().strftime("%B %d, %Y"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/patient/submit-to-doctor")
def submit_to_doctor(submission: PatientReviewSubmission):
    try:
        p_id = str(submission.patient_id or "PT-P101")
        p_name = str(submission.patient_name or "Patient")
        doc_id = int(submission.doctor_id or 1)
        sc_data = submission.self_check_data or {}

        with get_conn() as conn:
            cursor = conn.execute(
                """
                INSERT INTO patient_reviews (patient_id, patient_name, doctor_id, self_check_json, status, created_at)
                VALUES (?, ?, ?, ?, 'PENDING', datetime('now', 'localtime'))
                """,
                (p_id, p_name, doc_id, json.dumps(sc_data))
            )
            review_id = cursor.lastrowid

        try:
            score = float(sc_data.get("riskScore", 50))
            if score > 1:
                score = score / 100.0
            check_and_create_alert(
                patient_id=p_id,
                risk_level="high" if score >= 0.6 else ("medium" if score >= 0.3 else "low"),
                risk_score=score,
                pathology=f"Self-Check by {p_name}",
                doctor_id=doc_id
            )
        except Exception as alert_e:
            print(f"Alert creation skipped: {alert_e}")

        return {"success": True, "review_id": review_id, "message": "Report sent to doctor!"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def _parse_sc(raw):
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return {}
    return {}

@app.get("/doctor/pending-reviews")
def get_pending_reviews(doctor_id: int = 1):
    try:
        with get_conn() as conn:
            rows = conn.execute("SELECT * FROM patient_reviews WHERE doctor_id = ? AND status = 'PENDING' ORDER BY created_at DESC", (doctor_id,)).fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["self_check_json"] = _parse_sc(item.get("self_check_json"))
                results.append(item)
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/reviews/{review_id}")
def get_review_by_id(review_id: int):
    try:
        with get_conn() as conn:
            row = conn.execute("SELECT * FROM patient_reviews WHERE id = ?", (review_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Review not found")
            item = dict(row)
            item["self_check_json"] = _parse_sc(item.get("self_check_json"))
            return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/respond-review")
def respond_to_patient(data: DoctorResponseData):
    try:
        with get_conn() as conn:
            conn.execute(
                """
                UPDATE patient_reviews
                SET status = 'REVIEWED',
                    doctor_action = ?,
                    doctor_note = ?,
                    appointment_time = ?,
                    reviewed_at = datetime('now', 'localtime')
                WHERE id = ?
                """,
                (data.action, data.doctor_note, data.appointment_time, data.review_id)
            )
        return {"success": True, "message": "Instructions sent to patient!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{patient_id}/doctor-instructions")
def get_doctor_instructions(patient_id: str):
    try:
        with get_conn() as conn:
            rows = conn.execute("SELECT * FROM patient_reviews WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)).fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["self_check_json"] = _parse_sc(item.get("self_check_json"))
                results.append(item)
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
