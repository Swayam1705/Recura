"""
Recura Clinical Alerts System
Auto-triggers notifications for high-risk predictions.
Supports in-app + email delivery.
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

# Default configuration
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
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS alerts (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
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

        CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged);
        CREATE INDEX IF NOT EXISTS idx_alerts_date ON alerts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);
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


# ══════════════════════════════════════════════════════════════
#  CONFIG MANAGEMENT
# ══════════════════════════════════════════════════════════════

def load_config() -> dict:
    """Load alert configuration from disk"""
    if not CONFIG_PATH.exists():
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_PATH, "r") as f:
            config = json.load(f)
        # Merge with defaults for any missing keys
        return {**DEFAULT_CONFIG, **config}
    except Exception:
        return DEFAULT_CONFIG.copy()


def save_config(config: dict) -> None:
    """Persist alert configuration"""
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


# ══════════════════════════════════════════════════════════════
#  EMAIL SENDER (Gmail SMTP)
# ══════════════════════════════════════════════════════════════

def send_email_alert(alert: dict, recipients: list) -> bool:
    """Send email notification. Returns True if successful."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        print("⚠ Email credentials not configured (SMTP_USER, SMTP_PASS)")
        return False

    if not recipients:
        return False

    risk_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(
        alert["risk_level"].lower(), "⚪"
    )
    risk_color = {"high": "#dc2626", "medium": "#d97706", "low": "#059669"}.get(
        alert["risk_level"].lower(), "#6b7280"
    )
    risk_bg = {"high": "#fee2e2", "medium": "#fef3c7", "low": "#d1fae5"}.get(
        alert["risk_level"].lower(), "#f3f4f6"
    )

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: linear-gradient(135deg, #0f766e, #06b6d4); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
          🏥 Recura Clinical Alert
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">
          Automated Risk Notification System
        </p>
      </div>

      <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none;">
        <div style="background: {risk_bg}; padding: 18px; border-radius: 10px; margin-bottom: 24px; border-left: 4px solid {risk_color};">
          <h2 style="margin: 0 0 4px; color: {risk_color}; font-size: 20px;">
            {risk_emoji} {alert['risk_level'].upper()} RISK ALERT
          </h2>
          <p style="margin: 0; color: #374151; font-size: 14px;">
            Immediate clinical review recommended
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 13px; width: 40%;">
              PATIENT ID
            </td>
            <td style="padding: 12px 0; font-family: monospace; font-size: 15px; font-weight: 600; color: #111827;">
              {alert['patient_id']}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 13px;">
              RECURRENCE PROBABILITY
            </td>
            <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: {risk_color};">
              {(alert['risk_score'] * 100):.1f}%
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 13px;">
              PATHOLOGY
            </td>
            <td style="padding: 12px 0; color: #111827; font-size: 14px;">
              {alert.get('pathology', 'N/A')}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 13px;">
              TIMESTAMP
            </td>
            <td style="padding: 12px 0; color: #111827; font-size: 14px;">
              {alert['created_at']}
            </td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding: 16px; background: #f0fdfa; border-radius: 8px; border: 1px solid #a7f3d0;">
          <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.5;">
            <strong>💡 Clinical Recommendation:</strong><br>
            {alert.get('message', 'Review patient chart and initiate appropriate follow-up.')}
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:3000/dashboard/notifications" 
             style="display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            View in Dashboard →
          </a>
        </div>
      </div>

      <div style="background: #f9fafb; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center; color: #9ca3af; font-size: 11px;">
        <p style="margin: 0;">Recura Clinical Platform · Confidential Medical Alert</p>
        <p style="margin: 4px 0 0;">This is an automated notification. Do not reply.</p>
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

        print(f"✓ Email alert sent for {alert['patient_id']} to {len(recipients)} recipient(s)")
        return True
    except Exception as e:
        print(f"✗ Email send failed: {e}")
        return False


# ══════════════════════════════════════════════════════════════
#  ALERT CREATION (called from /predict)
# ══════════════════════════════════════════════════════════════

def check_and_create_alert(patient_id: str, risk_level: str, risk_score: float, pathology: str = "") -> dict | None:
    """
    Check if this prediction should trigger an alert based on config.
    Returns the alert dict if created, else None.
    """
    config = load_config()

    # Check if notifications are enabled for this risk level
    level = risk_level.lower()
    if level == "high" and not config.get("notify_on_high", True):
        return None
    if level == "medium" and not config.get("notify_on_medium", True):
        return None
    if level == "low" and not config.get("notify_on_low", False):
        return None

    # Check thresholds
    if level == "high" and risk_score < config.get("high_risk_threshold", 0.65):
        return None
    if level == "medium" and risk_score < config.get("medium_risk_threshold", 0.40):
        return None

    # Generate message
    messages = {
        "high": f"URGENT: {patient_id} has {risk_score*100:.1f}% recurrence risk. Immediate oncology consultation recommended within 48 hours.",
        "medium": f"Enhanced surveillance needed: {patient_id} shows elevated risk ({risk_score*100:.1f}%). Schedule follow-up within 4-6 weeks.",
        "low": f"{patient_id} shows favorable prognosis ({risk_score*100:.1f}%). Continue standard monitoring.",
    }

    severity_map = {"high": "critical", "medium": "warning", "low": "info"}

    # Create alert record
    with get_conn() as conn:
        cursor = conn.execute("""
        INSERT INTO alerts (patient_id, risk_level, risk_score, pathology, message, severity)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id, level, risk_score, pathology,
            messages.get(level, ""), severity_map.get(level, "info")
        ))
        alert_id = cursor.lastrowid

        # Retrieve the created alert
        row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        alert = dict(row)

    # Send email if enabled (async in production, but sync here for simplicity)
    if config.get("email_enabled") and config.get("email_recipients"):
        try:
            email_sent = send_email_alert(alert, config["email_recipients"])
            if email_sent:
                with get_conn() as conn:
                    conn.execute("UPDATE alerts SET email_sent = 1 WHERE id = ?", (alert_id,))
        except Exception as e:
            print(f"Email dispatch error: {e}")

    print(f"🔔 Alert created: #{alert_id} for {patient_id} ({level.upper()})")
    return alert


# ══════════════════════════════════════════════════════════════
#  ALERT QUERIES
# ══════════════════════════════════════════════════════════════

def get_alerts(unread_only: bool = False, limit: int = 50) -> list:
    """Get alerts, most recent first"""
    with get_conn() as conn:
        query = "SELECT * FROM alerts"
        if unread_only:
            query += " WHERE acknowledged = 0"
        query += " ORDER BY created_at DESC LIMIT ?"
        rows = conn.execute(query, (limit,)).fetchall()
        return [dict(row) for row in rows]


def get_alert_counts() -> dict:
    """Get counts of alerts by category"""
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) as c FROM alerts").fetchone()["c"]
        unread = conn.execute("SELECT COUNT(*) as c FROM alerts WHERE acknowledged = 0").fetchone()["c"]
        high = conn.execute(
            "SELECT COUNT(*) as c FROM alerts WHERE risk_level='high' AND acknowledged=0"
        ).fetchone()["c"]
        medium = conn.execute(
            "SELECT COUNT(*) as c FROM alerts WHERE risk_level='medium' AND acknowledged=0"
        ).fetchone()["c"]

        # Recent 24h
        recent = conn.execute("""
        SELECT COUNT(*) as c FROM alerts
        WHERE datetime(created_at) >= datetime('now', '-1 day', 'localtime')
        """).fetchone()["c"]

    return {
        "total": total,
        "unread": unread,
        "unread_high": high,
        "unread_medium": medium,
        "last_24h": recent,
    }


def acknowledge_alert(alert_id: int, user: str = "Dr. Swayam") -> bool:
    with get_conn() as conn:
        cursor = conn.execute("""
        UPDATE alerts
        SET acknowledged = 1,
            acknowledged_at = datetime('now', 'localtime'),
            acknowledged_by = ?
        WHERE id = ? AND acknowledged = 0
        """, (user, alert_id))
        return cursor.rowcount > 0


def acknowledge_all(user: str = "Dr. Swayam") -> int:
    with get_conn() as conn:
        cursor = conn.execute("""
        UPDATE alerts
        SET acknowledged = 1,
            acknowledged_at = datetime('now', 'localtime'),
            acknowledged_by = ?
        WHERE acknowledged = 0
        """, (user,))
        return cursor.rowcount


def delete_alert(alert_id: int) -> bool:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
        return cursor.rowcount > 0


# Initialize on import
init_alerts_db()