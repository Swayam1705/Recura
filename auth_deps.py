import jwt
from fastapi import Header, HTTPException, Depends
from database import get_conn

SECRET_KEY = "recura_super_secret_capstone_key"

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token missing or invalid format")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_doctor(user: dict = Depends(get_current_user)):
    if user.get("role") == "patient":
        raise HTTPException(status_code=403, detail="Access denied. Doctor access required.")
    
    doctor_id = int(user.get("sub", 0))
    with get_conn() as conn:
        doctor = conn.execute("SELECT * FROM doctors WHERE id = ?", (doctor_id,)).fetchone()
        if not doctor:
            raise HTTPException(status_code=401, detail="Doctor account not found")
        return dict(doctor)

def get_current_patient(user: dict = Depends(get_current_user)):
    if user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Access denied. Patient access required.")
    
    patient_id = int(user.get("sub", 0))
    with get_conn() as conn:
        patient = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not patient:
            raise HTTPException(status_code=401, detail="Patient account not found")
        return dict(patient)

def verify_doctor_patient_access(doctor_id: int, patient_str_id: str):
    with get_conn() as conn:
        patient = conn.execute(
            "SELECT * FROM patients WHERE (id = ? OR ('PT-P' || id) = ? OR ('PT-' || PRINTF('%06d', id)) = ?) AND linked_doctor_id = ?",
            (patient_str_id, patient_str_id, patient_str_id, doctor_id)
        ).fetchone()
        
        if patient:
            return dict(patient)
            
        prediction = conn.execute(
            "SELECT id FROM predictions WHERE patient_id = ? AND doctor_id = ?",
            (patient_str_id, doctor_id)
        ).fetchone()
        
        review = conn.execute(
            "SELECT id FROM patient_reviews WHERE patient_id = ? AND doctor_id = ?",
            (patient_str_id, doctor_id)
        ).fetchone()

        if not (prediction or review):
            raise HTTPException(status_code=403, detail="Access denied. Patient not assigned to this doctor.")
