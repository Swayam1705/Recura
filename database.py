"""
Recura Patient History Database (SQLite)
Auto-saves every prediction for longitudinal tracking with doctor-level data isolation.
"""

import sqlite3
import json
import os
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "recura_history.db"


def init_db():
    """Create tables and migrate schema if needed"""
    with get_conn() as conn:
        # 1. Create base tables
        conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id             INTEGER DEFAULT 1,
            patient_id            TEXT NOT NULL,
            age                   INTEGER,
            pathology             TEXT,
            t_stage               TEXT,
            n_stage               TEXT,
            risk_category         TEXT,
            response              TEXT,
            physical_examination  TEXT,
            recurrence_probability REAL NOT NULL,
            confidence            REAL,
            risk_level            TEXT NOT NULL,
            prediction            INTEGER,
            model_version         TEXT,
            shap_values_json      TEXT,
            input_data_json       TEXT,
            created_at            TEXT DEFAULT (datetime('now', 'localtime'))
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            name                  TEXT NOT NULL,
            email                 TEXT UNIQUE NOT NULL,
            hospital              TEXT,
            password_hash         TEXT NOT NULL,
            created_at            TEXT DEFAULT (datetime('now', 'localtime'))
        );
        """)

        # 2. Check and migrate column FIRST if old db file exists
        cursor = conn.execute("PRAGMA table_info(predictions)")
        columns = [col["name"] for col in cursor.fetchall()]
        if "doctor_id" not in columns:
            conn.execute("ALTER TABLE predictions ADD COLUMN doctor_id INTEGER DEFAULT 1")
            print("Migrated schema: Added doctor_id to predictions table")

        # 3. Create indexes AFTER migration is done
        conn.execute("CREATE INDEX IF NOT EXISTS idx_patient_id ON predictions(patient_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_risk_level ON predictions(risk_level);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON predictions(created_at DESC);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_doctor_id ON predictions(doctor_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_doctor_email ON doctors(email);")
        
        # Auto-migration: check if doctor_id exists in predictions
        cursor = conn.execute("PRAGMA table_info(predictions)")
        columns = [col["name"] for col in cursor.fetchall()]
        if "doctor_id" not in columns:
            conn.execute("ALTER TABLE predictions ADD COLUMN doctor_id INTEGER DEFAULT 1")
            print("Migrated schema: Added doctor_id to predictions table")


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


def save_prediction(patient_input: dict, prediction_result: dict, doctor_id: int = 1) -> int:
    """Save a prediction linked to a specific doctor ID."""
    with get_conn() as conn:
        cursor = conn.execute("""
        INSERT INTO predictions (
            doctor_id, patient_id, age, pathology, t_stage, n_stage, risk_category,
            response, physical_examination, recurrence_probability,
            confidence, risk_level, prediction, model_version,
            shap_values_json, input_data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        return cursor.lastrowid


def get_all_predictions(search: str = "", risk_filter: str = "",
                        page: int = 1, per_page: int = 20, doctor_id: int = None) -> dict:
    """Get paginated predictions for a specific doctor"""
    offset = (page - 1) * per_page
    conditions = []
    params = []

    if doctor_id:
        conditions.append("doctor_id = ?")
        params.append(doctor_id)

    if search:
        conditions.append("(patient_id LIKE ? OR pathology LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    if risk_filter and risk_filter.lower() in ("low", "medium", "high"):
        conditions.append("LOWER(risk_level) = ?")
        params.append(risk_filter.lower())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_conn() as conn:
        count_query = f"SELECT COUNT(*) as total FROM predictions {where_clause}"
        total = conn.execute(count_query, params).fetchone()["total"]

        query = f"""
        SELECT id, doctor_id, patient_id, age, pathology, t_stage, n_stage, risk_category,
               response, physical_examination, recurrence_probability, confidence,
               risk_level, prediction, model_version, created_at
        FROM predictions
        {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """
        rows = conn.execute(query, [*params, per_page, offset]).fetchall()
        predictions = [dict(row) for row in rows]

    return {
        "predictions": predictions,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total else 1,
    }


def get_patient_timeline(patient_id: str, doctor_id: int = None) -> list:
    """Get predictions for a specific patient under a doctor's workspace"""
    conditions = ["patient_id = ?"]
    params = [patient_id]

    if doctor_id:
        conditions.append("doctor_id = ?")
        params.append(doctor_id)

    where_clause = "WHERE " + " AND ".join(conditions)

    with get_conn() as conn:
        rows = conn.execute(f"""
        SELECT id, doctor_id, patient_id, age, pathology, t_stage, n_stage, risk_category,
               response, physical_examination, recurrence_probability, confidence,
               risk_level, prediction, model_version, shap_values_json,
               input_data_json, created_at
        FROM predictions
        {where_clause}
        ORDER BY created_at DESC
        """, params).fetchall()

        results = []
        for row in rows:
            record = dict(row)
            try:
                record["shap_values"] = json.loads(record.pop("shap_values_json") or "[]")
            except Exception:
                record["shap_values"] = []
            try:
                record["input_data"] = json.loads(record.pop("input_data_json") or "{}")
            except Exception:
                record["input_data"] = {}
            results.append(record)

        return results


def get_stats(doctor_id: int = None) -> dict:
    """Aggregate stats for a specific doctor's workspace"""
    where_clause = "WHERE doctor_id = ?" if doctor_id else ""
    params = [doctor_id] if doctor_id else []

    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) as c FROM predictions {where_clause}", params).fetchone()["c"]

        by_risk = {"low": 0, "medium": 0, "high": 0}
        risk_query = f"SELECT LOWER(risk_level) as risk, COUNT(*) as c FROM predictions {where_clause} GROUP BY LOWER(risk_level)"
        rows = conn.execute(risk_query, params).fetchall()
        for row in rows:
            if row["risk"] in by_risk:
                by_risk[row["risk"]] = row["c"]

        avg_query = f"SELECT AVG(recurrence_probability) as avg FROM predictions {where_clause}"
        avg = conn.execute(avg_query, params).fetchone()
        avg_score = float(avg["avg"]) if avg["avg"] is not None else 0.0

        uniq_query = f"SELECT COUNT(DISTINCT patient_id) as c FROM predictions {where_clause}"
        unique_patients = conn.execute(uniq_query, params).fetchone()["c"]

        recent_cond = f"{where_clause} AND" if where_clause else "WHERE"
        recent_query = f"""
        SELECT COUNT(*) as c FROM predictions
        {recent_cond} datetime(created_at) >= datetime('now', '-7 days', 'localtime')
        """
        recent = conn.execute(recent_query, params).fetchone()["c"]

    return {
        "total_predictions": total,
        "unique_patients": unique_patients,
        "high_risk": by_risk["high"],
        "medium_risk": by_risk["medium"],
        "low_risk": by_risk["low"],
        "avg_risk_score": round(avg_score, 3),
        "recent_7_days": recent,
    }


def delete_prediction(prediction_id: int) -> bool:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
        return cursor.rowcount > 0


def export_all_csv(doctor_id: int = None) -> str:
    import csv
    import io

    where_clause = "WHERE doctor_id = ?" if doctor_id else ""
    params = [doctor_id] if doctor_id else []

    with get_conn() as conn:
        rows = conn.execute(f"""
        SELECT patient_id, age, pathology, t_stage, n_stage, risk_category,
               response, physical_examination, recurrence_probability,
               confidence, risk_level, model_version, created_at
        FROM predictions
        {where_clause}
        ORDER BY created_at DESC
        """, params).fetchall()

        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            for row in rows:
                writer.writerow(dict(row))
        return output.getvalue()


# Initialize on import
init_db()