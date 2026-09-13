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
        CREATE TABLE IF NOT EXISTS hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            city TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hospital TEXT NOT NULL,
            hospital_id INTEGER,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            linked_doctor_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (linked_doctor_id) REFERENCES doctors(id)
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER NOT NULL,
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
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
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
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            reviewed_at TEXT,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER NOT NULL,
            patient_id TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            risk_score REAL NOT NULL,
            pathology TEXT,
            message TEXT,
            severity TEXT DEFAULT 'info',
            acknowledged INTEGER DEFAULT 0,
            acknowledged_at TEXT,
            acknowledged_by TEXT,
            email_sent INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
        """)

        conn.execute("CREATE INDEX IF NOT EXISTS idx_predictions_doc ON predictions(doctor_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_predictions_patient ON predictions(patient_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_patients_doc ON patients(linked_doctor_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_reviews_doc ON patient_reviews(doctor_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_reviews_patient ON patient_reviews(patient_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_doc ON alerts(doctor_id);")

def save_prediction(patient_input: dict, prediction_result: dict, doctor_id: int = 1) -> int:
    with get_conn() as conn:
        cursor = conn.execute("""
        INSERT INTO predictions (
            doctor_id, patient_id, age, pathology, t_stage, n_stage, risk_category,
            response, physical_examination, recurrence_probability,
            confidence, risk_level, prediction, model_version,
            shap_values_json, input_data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doctor_id,
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
        return cursor.lastrowid

def get_all_predictions(search: str = "", risk_filter: str = "", page: int = 1, per_page: int = 20, doctor_id: int = None) -> dict:
    offset = (page - 1) * per_page
    conditions = ["doctor_id = ?"]
    params = [doctor_id]

    if search:
        conditions.append("(patient_id LIKE ? OR pathology LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    if risk_filter and risk_filter.lower() in ("low", "medium", "high"):
        conditions.append("LOWER(risk_level) = ?")
        params.append(risk_filter.lower())

    where_clause = f"WHERE {' AND '.join(conditions)}"

    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) as total FROM predictions {where_clause}", params).fetchone()["total"]
        query = f"SELECT * FROM predictions {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?"
        rows = conn.execute(query, [*params, per_page, offset]).fetchall()
        return {
            "predictions": [dict(row) for row in rows],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page if total else 1,
        }

def get_patient_timeline(patient_id: str, doctor_id: int = None) -> list:
    results = []
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE patient_id = ? AND doctor_id = ? ORDER BY created_at DESC",
            (patient_id, doctor_id)
        ).fetchall()
        
        for row in rows:
            rec = dict(row)
            try: rec["shap_values"] = json.loads(rec.pop("shap_values_json") or "[]")
            except Exception: rec["shap_values"] = []
            try: rec["input_data"] = json.loads(rec.pop("input_data_json") or "{}")
            except Exception: rec["input_data"] = {}
            rec["record_type"] = "prediction"
            results.append(rec)

        rev_rows = conn.execute(
            "SELECT * FROM patient_reviews WHERE patient_id = ? AND doctor_id = ? ORDER BY created_at DESC",
            (patient_id, doctor_id)
        ).fetchall()
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
                "pathology": "Patient Self-Check Report",
                "t_stage": "N/A",
                "n_stage": "N/A",
                "risk_category": sc_data.get("status", "Self-Check"),
                "response": sc_data.get("title", "Patient Submitted Report"),
                "physical_examination": f"Tg: {sc_data.get('tg_level', 'N/A')} ng/mL",
                "recurrence_probability": (sc_data.get("riskScore", 30.0) / 100.0),
                "confidence": 0.85,
                "risk_level": "high" if sc_data.get("color") == "red" else ("medium" if sc_data.get("color") == "yellow" else "low"),
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

    results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return results

def get_stats(doctor_id: int = None) -> dict:
    where_clause = "WHERE doctor_id = ?"
    params = [doctor_id]

    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) as c FROM predictions {where_clause}", params).fetchone()["c"]
        by_risk = {"low": 0, "medium": 0, "high": 0}
        for row in conn.execute(f"SELECT LOWER(risk_level) as risk, COUNT(*) as c FROM predictions {where_clause} GROUP BY LOWER(risk_level)", params).fetchall():
            if row["risk"] in by_risk:
                by_risk[row["risk"]] = row["c"]
        
        avg = conn.execute(f"SELECT AVG(recurrence_probability) as avg FROM predictions {where_clause}", params).fetchone()
        avg_score = float(avg["avg"]) if avg["avg"] is not None else 0.0
        uniq = conn.execute(f"SELECT COUNT(DISTINCT patient_id) as c FROM predictions {where_clause}", params).fetchone()["c"]
        recent = conn.execute(f"SELECT COUNT(*) as c FROM predictions {where_clause} AND datetime(created_at) >= datetime('now', '-7 days', 'localtime')", params).fetchone()["c"]

    return {
        "total_predictions": total,
        "unique_patients": uniq,
        "high_risk": by_risk["high"],
        "medium_risk": by_risk["medium"],
        "low_risk": by_risk["low"],
        "avg_risk_score": round(avg_score, 3),
        "recent_7_days": recent,
    }

def delete_prediction(prediction_id: int, doctor_id: int) -> bool:
    with get_conn() as conn:
        return conn.execute("DELETE FROM predictions WHERE id = ? AND doctor_id = ?", (prediction_id, doctor_id)).rowcount > 0

def export_all_csv(doctor_id: int = None) -> str:
    import csv, io
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM predictions WHERE doctor_id = ? ORDER BY created_at DESC", (doctor_id,)).fetchall()
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            for row in rows:
                writer.writerow(dict(row))
        return output.getvalue()

init_db()
