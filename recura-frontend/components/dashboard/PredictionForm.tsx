"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import PatientIdField from "./PatientIdField";
import ResultCard from "./ResultCard";

const OPTIONS = {
  Response: ["Excellent", "Indeterminate", "Biochemical Incomplete", "Structural Incomplete"],
  Risk: ["Low", "Intermediate", "High"],
  T: ["T1a", "T1b", "T2", "T3a", "T3b", "T4a", "T4b"],
  N: ["N0", "N1a", "N1b"],
  Physical_Examination: ["Normal", "Single nodular goiter-left", "Single nodular goiter-right", "Multinodular goiter", "Diffuse goiter"],
  Pathology: ["Micropapillary", "Papillary", "Follicular", "Hurthel cell"],
};

export default function PredictionForm({ initialData = {} }: { initialData?: any }) {
  const [formData, setFormData] = useState({
    Age: initialData.Age || 45,
    Response: initialData.Response || "Excellent",
    Risk: initialData.Risk || "Low",
    T: initialData.T || "T1a",
    N: initialData.N || "N0",
    Physical_Examination: initialData.Physical_Examination || "Normal",
    Pathology: initialData.Pathology || "Papillary",
    patient_id: "",
  });

  const [patientMode, setPatientMode] = useState<"new" | "followup">("new");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const getDoctorId = () => {
    try {
      const u = JSON.parse(localStorage.getItem("recura_user") || "{}");
      return u.id || 1;
    } catch {
      return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...formData, 
        patient_id: patientMode === "new" ? "" : formData.patient_id,
        doctor_id: getDoctorId() 
      };

      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Prediction failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={{ animation: "fadeIn 0.5s ease-out" }}>
        <button
          onClick={() => setResult(null)}
          style={{
            marginBottom: "1.5rem", padding: "0.5rem 1rem", background: "white",
            border: "1px solid #E5E7EB", borderRadius: "8px", fontWeight: 600, cursor: "pointer",
          }}
        >
          ← Run another prediction
        </button>
        <ResultCard result={result} patientInput={formData} />
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={18} color="#2563EB" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#111827" }}>Patient Clinical Data</h2>
          <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: 0 }}>Powered by trained Deep 1D-CNN model</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
        <PatientIdField 
          value={formData.patient_id} 
          onChange={(val) => setFormData({ ...formData, patient_id: val })} 
          mode={patientMode}
          setMode={setPatientMode}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Patient Age (years)</label>
            <input type="number" required value={formData.Age} onChange={(e) => setFormData({ ...formData, Age: Number(e.target.value) })} style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
          </div>
          
          {Object.entries(OPTIONS).map(([key, options]) => (
            <div key={key}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>{key.replace("_", " ")}</label>
              <select value={(formData as any)[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #D1D5DB", backgroundColor: "white" }}>
                {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.875rem", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <Brain size={18} /> {loading ? "Analyzing Data..." : "Run AI Prediction"}
        </button>
      </form>
    </div>
  );
}

