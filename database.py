"""
Recura Patient History Database (SQLite)
Auto-saves every prediction for longitudinal tracking.
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
    """Create tables if they don't exist"""
    with get_conn() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS predictions (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
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

        CREATE INDEX IF NOT EXISTS idx_patient_id ON predictions(patient_id);
        CREATE INDEX IF NOT EXISTS idx_risk_level ON predictions(risk_level);
        CREATE INDEX IF NOT EXISTS idx_created_at ON predictions(created_at DESC);
        """)


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


def save_prediction(patient_input: dict, prediction_result: dict) -> int:
    """Save a prediction to database. Returns new row ID."""
    with get_conn() as conn:
        cursor = conn.execute("""
        INSERT INTO predictions (
            patient_id, age, pathology, t_stage, n_stage, risk_category,
            response, physical_examination, recurrence_probability,
            confidence, risk_level, prediction, model_version,
            shap_values_json, input_data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
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
                        page: int = 1, per_page: int = 20) -> dict:
    """Get paginated predictions with optional search + risk filter"""
    offset = (page - 1) * per_page
    conditions = []
    params = []

    if search:
        conditions.append("(patient_id LIKE ? OR pathology LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    if risk_filter and risk_filter.lower() in ("low", "medium", "high"):
        conditions.append("LOWER(risk_level) = ?")
        params.append(risk_filter.lower())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_conn() as conn:
        # Total count
        count_query = f"SELECT COUNT(*) as total FROM predictions {where_clause}"
        total = conn.execute(count_query, params).fetchone()["total"]

        # Paginated results
        query = f"""
        SELECT id, patient_id, age, pathology, t_stage, n_stage, risk_category,
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


def get_patient_timeline(patient_id: str) -> list:
    """Get all predictions for a specific patient (their timeline)"""
    with get_conn() as conn:
        rows = conn.execute("""
        SELECT id, patient_id, age, pathology, t_stage, n_stage, risk_category,
               response, physical_examination, recurrence_probability, confidence,
               risk_level, prediction, model_version, shap_values_json,
               input_data_json, created_at
        FROM predictions
        WHERE patient_id = ?
        ORDER BY created_at DESC
        """, (patient_id,)).fetchall()

        results = []
        for row in rows:
            record = dict(row)
            # Parse JSON fields
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


def get_stats() -> dict:
    """Aggregate stats for dashboard"""
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) as c FROM predictions").fetchone()["c"]

        by_risk = {"low": 0, "medium": 0, "high": 0}
        rows = conn.execute("""
        SELECT LOWER(risk_level) as risk, COUNT(*) as c
        FROM predictions GROUP BY LOWER(risk_level)
        """).fetchall()
        for row in rows:
            if row["risk"] in by_risk:
                by_risk[row["risk"]] = row["c"]

        avg = conn.execute("SELECT AVG(recurrence_probability) as avg FROM predictions").fetchone()
        avg_score = float(avg["avg"]) if avg["avg"] is not None else 0.0

        unique_patients = conn.execute(
            "SELECT COUNT(DISTINCT patient_id) as c FROM predictions"
        ).fetchone()["c"]

        # Recent activity - last 7 days
        recent = conn.execute("""
        SELECT COUNT(*) as c FROM predictions
        WHERE datetime(created_at) >= datetime('now', '-7 days', 'localtime')
        """).fetchone()["c"]

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
    """Delete a specific prediction by ID"""
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
        return cursor.rowcount > 0


def export_all_csv() -> str:
    """Export all predictions as CSV string"""
    import csv
    import io

    with get_conn() as conn:
        rows = conn.execute("""
        SELECT patient_id, age, pathology, t_stage, n_stage, risk_category,
               response, physical_examination, recurrence_probability,
               confidence, risk_level, model_version, created_at
        FROM predictions
        ORDER BY created_at DESC
        """).fetchall()

        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            for row in rows:
                writer.writerow(dict(row))
        return output.getvalue()


# Initialize on import
init_db()