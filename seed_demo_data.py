import sqlite3
import bcrypt
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "recura_history.db"

def hash_pw(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_database():
    print("=" * 60)
    print("RECURA MULTI-TENANT DATABASE RESET & SEEDING")
    print("=" * 60)

    if DB_PATH.exists():
        DB_PATH.unlink()
        print("🗑️ Existing database file deleted.")

    from database import init_db, get_conn
    init_db()
    print("✅ Fresh multi-tenant database tables initialized.")

    default_pw = hash_pw("Demo@123")

    with get_conn() as conn:
        hospitals = [
            ("City Care Hospital", "New York"),
            ("Metro Endocrine Center", "Chicago"),
            ("Sunrise Oncology Clinic", "San Francisco")
        ]
        h_ids = []
        for h_name, h_city in hospitals:
            c = conn.execute("INSERT INTO hospitals (name, city) VALUES (?, ?)", (h_name, h_city))
            h_ids.append(c.lastrowid)

        doctors = [
            ("Dr. Mihir Sharma", "doctor1@recura.com", "City Care Hospital", h_ids[0]),
            ("Dr. Ananya Patel", "doctor2@recura.com", "Metro Endocrine Center", h_ids[1]),
            ("Dr. Rahul Verma", "doctor3@recura.com", "Sunrise Oncology Clinic", h_ids[2])
        ]
        doc_ids = []
        for name, email, hosp, h_id in doctors:
            c = conn.execute(
                "INSERT INTO doctors (name, email, hospital, hospital_id, password_hash) VALUES (?, ?, ?, ?, ?)",
                (name, email, hosp, h_id, default_pw)
            )
            doc_ids.append(c.lastrowid)

        patients = [
            ("Priya Nair", "patient1a@recura.com", "555-0101", doc_ids[0]),
            ("Arjun Mehta", "patient1b@recura.com", "555-0102", doc_ids[0]),
            ("Sneha Kapoor", "patient2a@recura.com", "555-0201", doc_ids[1]),
            ("Vikram Singh", "patient2b@recura.com", "555-0202", doc_ids[1]),
            ("Meera Iyer", "patient2c@recura.com", "555-0203", doc_ids[1]),
            ("Rohan Das", "patient3a@recura.com", "555-0301", doc_ids[2]),
            ("Kavya Reddy", "patient3b@recura.com", "555-0302", doc_ids[2])
        ]
        pat_ids = []
        for name, email, phone, doc_id in patients:
            c = conn.execute(
                "INSERT INTO patients (name, email, phone, password_hash, linked_doctor_id) VALUES (?, ?, ?, ?, ?)",
                (name, email, phone, default_pw, doc_id)
            )
            pat_ids.append(c.lastrowid)

        sample_predictions = [
            (doc_ids[0], f"PT-P{pat_ids[0]}", 45, "Papillary", "T2", "N0", "Low", "Excellent", "Normal", 0.12, 0.88, "low", 0),
            (doc_ids[0], f"PT-P{pat_ids[1]}", 58, "Follicular", "T3a", "N1b", "High", "Structural Incomplete", "Multinodular goiter", 0.78, 0.78, "high", 1),
            (doc_ids[1], f"PT-P{pat_ids[2]}", 34, "Micropapillary", "T1a", "N0", "Low", "Excellent", "Normal", 0.08, 0.92, "low", 0),
            (doc_ids[2], f"PT-P{pat_ids[5]}", 62, "Hurthel cell", "T3b", "N1a", "Intermediate", "Biochemical Incomplete", "Single nodular goiter-left", 0.45, 0.65, "medium", 0)
        ]
        for p in sample_predictions:
            conn.execute("""
            INSERT INTO predictions (doctor_id, patient_id, age, pathology, t_stage, n_stage, risk_category, response, physical_examination, recurrence_probability, confidence, risk_level, prediction)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, p)

        sc_demo = {
            "status": "action_needed", "color": "red",
            "title": "🔴 Attention Required — Doctor Review Advised",
            "message": "Thyroglobulin (Tg) level elevated at 1.4 ng/mL with neck lump.",
            "recommendation": "Ultrasound and blood marker re-check advised.",
            "riskScore": 75.0,
            "reasons": ["Thyroglobulin (Tg) is elevated (1.4 ng/mL).", "Palpable neck lump detected."]
        }
        conn.execute("""
        INSERT INTO patient_reviews (patient_id, patient_name, doctor_id, self_check_json, status)
        VALUES (?, ?, ?, ?, 'PENDING')
        """, (f"PT-P{pat_ids[0]}", "Priya Nair", doc_ids[0], json.dumps(sc_demo)))

        conn.execute("""
        INSERT INTO alerts (doctor_id, patient_id, risk_level, risk_score, pathology, message, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (doc_ids[0], f"PT-P{pat_ids[1]}", "high", 0.78, "Follicular", "URGENT: High recurrence risk detected.", "critical"))

    print("\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print(f"  • Hospitals: 3")
    print(f"  • Doctors: 3")
    print(f"  • Patients: 7 (Assigned: Doc 1 -> 2, Doc 2 -> 3, Doc 3 -> 2)")
    print(f"  • Password for all accounts: Demo@123")
    print("=" * 60)

if __name__ == "__main__":
    seed_database()
