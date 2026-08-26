"""
Recura Clinical Alerts System
Auto-triggers notifications for high-risk predictions with doctor-level data isolation.
"""

import sqlite3
import json
import os
import smtplib
from contextlib import contextmanager
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "recura_alerts.db"
CONFIG_PATH = BASE_DIR / "alert_config.json"

DEFAULT_CONFIG = {
    "high_risk_threshold": 0.65,
    "medium_risk_threshold": 0.40,
    "in_app_enabled": True,
    "email_enabled": False,
    "email_recipients": [],
    "notify_on_high": True,
    "notify_on_medium": True,
    "notify_on_low": False,
}


def init_alerts_db():
    with get_conn() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id            INTEGER DEFAULT 1,
            patient_id           TEXT NOT NULL,
            risk_level           TEXT NOT NULL,
            risk_score           REAL NOT NULL,
            pathology            TEXT,
            message              TEXT,
            severity             TEXT DEFAULT 'info',
            acknowledged         INTEGER DEFAULT 0,
            acknowledged_at      TEXT,
            acknowledged_by      TEXT,
            email_sent           INTEGER DEFAULT 0,
            created_at           TEXT DEFAULT (datetime('now', 'localtime'))
        );
        """)

        # Migration check
        cursor = conn.execute("PRAGMA table_info(alerts)")
        columns = [col["name"] for col in cursor.fetchall()]
        if "doctor_id" not in columns:
            conn.execute("ALTER TABLE alerts ADD COLUMN doctor_id INTEGER DEFAULT 1")
            print("Migrated schema: Added doctor_id to alerts table")

        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_date ON alerts(created_at DESC);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_doctor ON alerts(doctor_id);")

        # Migration helper
        cursor = conn.execute("PRAGMA table_info(alerts)")
        columns = [col["name"] for col in cursor.fetchall()]
        if "doctor_id" not in columns:
            conn.execute("ALTER TABLE alerts ADD COLUMN doctor_id INTEGER DEFAULT 1")
            print("Migrated schema: Added doctor_id to alerts table")


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


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_PATH, "r") as f:
            config = json.load(f)
        return {**DEFAULT_CONFIG, **config}
    except Exception:
        return DEFAULT_CONFIG.copy()


def save_config(config: dict) -> None:
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


def send_email_alert(alert: dict, recipients: list) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_user or not smtp_pass or not recipients:
        return False

    risk_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(alert["risk_level"].lower(), "⚪")
    risk_color = {"high": "#dc2626", "medium": "#d97706", "low": "#059669"}.get(alert["risk_level"].lower(), "#6b7280")
    risk_bg = {"high": "#fee2e2", "medium": "#fef3c7", "low": "#d1fae5"}.get(alert["risk_level"].lower(), "#f3f4f6")

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: linear-gradient(135deg, #0f766e, #06b6d4); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">🏥 Recura Clinical Alert</h1>
      </div>
      <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none;">
        <div style="background: {risk_bg}; padding: 18px; border-radius: 10px; margin-bottom: 24px; border-left: 4px solid {risk_color};">
          <h2 style="margin: 0 0 4px; color: {risk_color}; font-size: 20px;">{risk_emoji} {alert['risk_level'].upper()} RISK ALERT</h2>
        </div>
        <p>Patient ID: <strong>{alert['patient_id']}</strong></p>
        <p>Recurrence Probability: <strong>{(alert['risk_score'] * 100):.1f}%</strong></p>
      </div>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Recura] {risk_emoji} {alert['risk_level'].upper()} Risk - {alert['patient_id']}"
        msg["From"] = smtp_user
        msg["To"] = ", ".join(recipients)
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, recipients, msg.as_string())
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False


def check_and_create_alert(patient_id: str, risk_level: str, risk_score: float, pathology: str = "", doctor_id: int = 1) -> dict | None:
    config = load_config()

    level = risk_level.lower()
    if level == "high" and not config.get("notify_on_high", True):
        return None
    if level == "medium" and not config.get("notify_on_medium", True):
        return None
    if level == "low" and not config.get("notify_on_low", False):
        return None

    if level == "high" and risk_score < config.get("high_risk_threshold", 0.65):
        return None
    if level == "medium" and risk_score < config.get("medium_risk_threshold", 0.40):
        return None

    messages = {
        "high": f"URGENT: {patient_id} has {risk_score*100:.1f}% recurrence risk. Immediate oncology consultation recommended.",
        "medium": f"Enhanced surveillance needed: {patient_id} shows elevated risk ({risk_score*100:.1f}%).",
        "low": f"{patient_id} shows favorable prognosis ({risk_score*100:.1f}%).",
    }
    severity_map = {"high": "critical", "medium": "warning", "low": "info"}

    with get_conn() as conn:
        cursor = conn.execute("""
        INSERT INTO alerts (doctor_id, patient_id, risk_level, risk_score, pathology, message, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            doctor_id or 1, patient_id, level, risk_score, pathology,
            messages.get(level, ""), severity_map.get(level, "info")
        ))
        alert_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        alert = dict(row)

    if config.get("email_enabled") and config.get("email_recipients"):
        try:
            if send_email_alert(alert, config["email_recipients"]):
                with get_conn() as conn:
                    conn.execute("UPDATE alerts SET email_sent = 1 WHERE id = ?", (alert_id,))
        except Exception as e:
            print(f"Email error: {e}")

    print(f"🔔 Alert created: #{alert_id} for {patient_id} (Doctor #{doctor_id})")
    return alert


def get_alerts(unread_only: bool = False, limit: int = 50, doctor_id: int = None) -> list:
    conditions = []
    params = []

    if doctor_id:
        conditions.append("doctor_id = ?")
        params.append(doctor_id)

    if unread_only:
        conditions.append("acknowledged = 0")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_conn() as conn:
        query = f"SELECT * FROM alerts {where_clause} ORDER BY created_at DESC LIMIT ?"
        rows = conn.execute(query, [*params, limit]).fetchall()
        return [dict(row) for row in rows]


def get_alert_counts(doctor_id: int = None) -> dict:
    where_clause = "WHERE doctor_id = ?" if doctor_id else ""
    params = [doctor_id] if doctor_id else []

    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) as c FROM alerts {where_clause}", params).fetchone()["c"]

        unread_cond = f"{where_clause} AND acknowledged = 0" if where_clause else "WHERE acknowledged = 0"
        unread = conn.execute(f"SELECT COUNT(*) as c FROM alerts {unread_cond}", params).fetchone()["c"]

        high_cond = f"{where_clause} AND risk_level='high' AND acknowledged=0" if where_clause else "WHERE risk_level='high' AND acknowledged=0"
        high = conn.execute(f"SELECT COUNT(*) as c FROM alerts {high_cond}", params).fetchone()["c"]

        med_cond = f"{where_clause} AND risk_level='medium' AND acknowledged=0" if where_clause else "WHERE risk_level='medium' AND acknowledged=0"
        medium = conn.execute(f"SELECT COUNT(*) as c FROM alerts {med_cond}", params).fetchone()["c"]

    return {
        "total": total,
        "unread": unread,
        "unread_high": high,
        "unread_medium": medium,
    }


def acknowledge_alert(alert_id: int, user: str = "Doctor") -> bool:
    with get_conn() as conn:
        cursor = conn.execute("""
        UPDATE alerts
        SET acknowledged = 1, acknowledged_at = datetime('now', 'localtime'), acknowledged_by = ?
        WHERE id = ? AND acknowledged = 0
        """, (user, alert_id))
        return cursor.rowcount > 0


def acknowledge_all(doctor_id: int = None, user: str = "Doctor") -> int:
    where_clause = "WHERE acknowledged = 0"
    params = [user]

    if doctor_id:
        where_clause += " AND doctor_id = ?"
        params.append(doctor_id)

    with get_conn() as conn:
        cursor = conn.execute(f"""
        UPDATE alerts SET acknowledged = 1, acknowledged_at = datetime('now', 'localtime'), acknowledged_by = ?
        {where_clause}
        """, params)
        return cursor.rowcount


def delete_alert(alert_id: int) -> bool:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
        return cursor.rowcount > 0


init_alerts_db()