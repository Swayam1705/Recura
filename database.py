import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "recura_history.db"

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_conn() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER DEFAULT 1,
            patient_id TEXT NOT NULL,
            age INTEGER,
            pathology TEXT,
            t_stage TEXT,
            n_stage TEXT,
            risk_category TEXT,
            response TEXT,
            physical_examination TEXT,
            recurrence_probability REAL NOT NULL,
            confidence REAL,
            risk_level TEXT NOT NULL,
            prediction INTEGER,
            model_version TEXT,
            shap_values_json TEXT,
            input_data_json TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hospital TEXT,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            linked_doctor_id INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS patient_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            patient_name TEXT,
            doctor_id INTEGER NOT NULL,
            self_check_json TEXT,
            status TEXT DEFAULT 'PENDING',
            doctor_action TEXT,
            doctor_note TEXT,
            appointment_time TEXT,
            created_at TEXT,
            reviewed_at TEXT
        )
        """)
        cols = [c["name"] for c in conn.execute("PRAGMA table_info(predictions)").fetchall()]
        if "doctor_id" not in cols:
            conn.execute("ALTER TABLE predictions ADD COLUMN doctor_id INTEGER DEFAULT 1")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_patient_id ON predictions(patient_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_risk_level ON predictions(risk_level)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON predictions(created_at DESC)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_doctor_id ON predictions(doctor_id)")

def save_prediction(patient_input, prediction_result, doctor_id=1):
    with get_conn() as conn:
        cur = conn.execute("""
        INSERT INTO predictions (
            doctor_id, patient_id, age, pathology, t_stage, n_stage, risk_category,
            response, physical_examination, recurrence_probability, confidence,
            risk_level, prediction, model_version, shap_values_json, input_data_json
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            doctor_id or 1,
            prediction_result.get("patientId"),
            int(patient_input.get("Age", 0)),
            patient_input.get("Pathology"),
            patient_input.get("T"),
            patient_input.get("N"),
            patient_input.get("Risk"),
            patient_input.get("Response"),
            patient_input.get("Physical_Examination"),
            float(prediction_result.get("recurrenceProbability", 0)),
            float(prediction_result.get("confidence", 0)),
            prediction_result.get("riskLevel"),
            int(prediction_result.get("prediction", 0)),
            prediction_result.get("modelVersion"),
            json.dumps(prediction_result.get("shapValues", [])),
            json.dumps(patient_input),
        ))
        return cur.lastrowid

def get_all_predictions(search="", risk_filter="", page=1, per_page=20, doctor_id=None):
    offset = (page - 1) * per_page
    conditions, params = [], []
    if doctor_id:
        conditions.append("doctor_id = ?"); params.append(doctor_id)
    if search:
        conditions.append("(patient_id LIKE ? OR pathology LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    if risk_filter and risk_filter.lower() in ("low", "medium", "high"):
        conditions.append("LOWER(risk_level) = ?"); params.append(risk_filter.lower())
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) as total FROM predictions {where}", params).fetchone()["total"]
        rows = conn.execute(f"SELECT * FROM predictions {where} ORDER BY created_at DESC LIMIT ? OFFSET ?", [*params, per_page, offset]).fetchall()
        return {
            "predictions": [dict(r) for r in rows],
            "total": total, "page": page, "per_page": per_page,
            "total_pages": max(1, (total + per_page - 1) // per_page),
        }

def get_patient_timeline(patient_id, doctor_id=None):
    results = []
    with get_conn() as conn:
        # 1. Query clinical predictions table
        conditions, params = ["patient_id = ?"], [patient_id]
        if doctor_id:
            conditions.append("doctor_id = ?"); params.append(doctor_id)
        where = "WHERE " + " AND ".join(conditions)
        rows = conn.execute(f"SELECT * FROM predictions {where} ORDER BY created_at DESC", params).fetchall()
        
        for row in rows:
            rec = dict(row)
            try: rec["shap_values"] = json.loads(rec.pop("shap_values_json") or "[]")
            except Exception: rec["shap_values"] = []
            try: rec["input_data"] = json.loads(rec.pop("input_data_json") or "{}")
            except Exception: rec["input_data"] = {}
            rec["record_type"] = "prediction"
            results.append(rec)

        # 2. Query patient self-check reviews table so PT-P1 / self-check IDs never fail with 404!
        rev_rows = conn.execute(f"SELECT * FROM patient_reviews WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)).fetchall()
        for r in rev_rows:
            rev = dict(r)
            sc_data = {}
            if rev.get("self_check_json"):
                try: sc_data = json.loads(rev["self_check_json"])
                except Exception: sc_data = {}
            
            results.append({
                "id": f"rev-{rev['id']}",
                "patient_id": rev["patient_id"],
                "age": sc_data.get("age", 45),
                "pathology": "Patient Self-Check Recovery Report",
                "t_stage": "N/A",
                "n_stage": "N/A",
                "risk_category": sc_data.get("status", "Self-Check"),
                "response": sc_data.get("title", "Patient Submitted Report"),
                "physical_examination": f"Tg: {sc_data.get('tg_level', 'N/A')} ng/mL",
                "recurrence_probability": (sc_data.get("riskScore", 30.0) / 100.0),
                "confidence": 0.85,
                "risk_level": sc_data.get("color") == "red" and "high" or (sc_data.get("color") == "yellow" and "medium" or "low"),
                "prediction": 1 if sc_data.get("color") == "red" else 0,
                "model_version": "Recura Patient Companion v4.1",
                "shap_values": [],
                "input_data": sc_data,
                "doctor_note": rev.get("doctor_note"),
                "doctor_action": rev.get("doctor_action"),
                "appointment_time": rev.get("appointment_time"),
                "created_at": rev.get("created_at"),
                "record_type": "patient_review"
            })

    # Sort combined events by created_at DESC
    results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return results

def get_stats(doctor_id=None):
    where = "WHERE doctor_id = ?" if doctor_id else ""
    params = [doctor_id] if doctor_id else []
    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) as c FROM predictions {where}", params).fetchone()["c"]
        by_risk = {"low": 0, "medium": 0, "high": 0}
        for row in conn.execute(f"SELECT LOWER(risk_level) as risk, COUNT(*) as c FROM predictions {where} GROUP BY LOWER(risk_level)", params):
            if row["risk"] in by_risk: by_risk[row["risk"]] = row["c"]
        avg = conn.execute(f"SELECT AVG(recurrence_probability) as avg FROM predictions {where}", params).fetchone()
        avg_score = float(avg["avg"]) if avg["avg"] is not None else 0.0
        uniq = conn.execute(f"SELECT COUNT(DISTINCT patient_id) as c FROM predictions {where}", params).fetchone()["c"]
        rc = f"{where} AND" if where else "WHERE"
        recent = conn.execute(f"SELECT COUNT(*) as c FROM predictions {rc} datetime(created_at) >= datetime('now', '-7 days', 'localtime')", params).fetchone()["c"]
    return {
        "total_predictions": total, "unique_patients": uniq,
        "high_risk": by_risk["high"], "medium_risk": by_risk["medium"], "low_risk": by_risk["low"],
        "avg_risk_score": round(avg_score, 3), "recent_7_days": recent,
    }

def delete_prediction(prediction_id):
    with get_conn() as conn:
        return conn.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,)).rowcount > 0

def export_all_csv(doctor_id=None):
    import csv, io
    where = "WHERE doctor_id = ?" if doctor_id else ""
    params = [doctor_id] if doctor_id else []
    with get_conn() as conn:
        rows = conn.execute(f"SELECT * FROM predictions {where} ORDER BY created_at DESC", params).fetchall()
        out = io.StringIO()
        if rows:
            w = csv.DictWriter(out, fieldnames=rows[0].keys())
            w.writeheader()
            for r in rows: w.writerow(dict(r))
        return out.getvalue()

init_db()
