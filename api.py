from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
# Import TensorFlow/Keras or Joblib depending on your model
from tensorflow.keras.models import load_model 

app = FastAPI(title="ThyroVault API", version="1.0")

# Load your model ONCE when the API starts (so it doesn't reload on every click)
# We will assume you saved it as 'deep_cnn_model.h5'
cnn_model = load_model("deep_cnn_model.h5")

class PatientData(BaseModel):
    Age: float
    Response: float
    Physical_Examination: float
    T: float
    N: float
    Risk: float
    Pathology: float

@app.post("/predict")
def predict_recurrence(patient: PatientData):
    # 1. Convert the incoming JSON into a numpy array for the model
    input_data = np.array([[
        patient.Age, 
        patient.Response, 
        patient.Physical_Examination, 
        patient.T, 
        patient.N, 
        patient.Risk, 
        patient.Pathology
    ]])
    
    # 2. Make the real prediction
    prediction_prob = cnn_model.predict(input_data)[0][0]
    
    # 3. Convert probability to a binary 1 or 0
    final_prediction = 1 if prediction_prob > 0.5 else 0
    status = "High Risk of Recurrence" if final_prediction == 1 else "Low Risk"

    return {
        "prediction": final_prediction,
        "confidence": float(prediction_prob),
        "status": status
    }