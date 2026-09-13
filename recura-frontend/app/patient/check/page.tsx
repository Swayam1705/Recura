"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, DollarSign,
  RefreshCw, FileText, HeartPulse, Send, Check, Stethoscope, Calendar, MessageSquare
} from "lucide-react";
import { generatePatientFriendlyReport } from "@/lib/generateReport";

export default function PatientCheckPage() {
  const [patient, setPatient] = useState<any>({});
  const [patientKey, setPatientKey] = useState("");
  const [formData, setFormData] = useState({
    age: 45,
    tg_level: 0.1,
    tgab_positive: false,
    neck_lump: false,
    voice_changes: false,
    swallowing_issue: false,
    years_since_surgery: 1,
  });

  const [loading, setLoading] = useState(false);
  const [sendingDoctor, setSendingDoctor] = useState(false);
  const [sentDoctor, setSentDoctor] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [doctorFeedback, setDoctorFeedback] = useState<any[]>([]);

  const fetchDoctorResponses = useCallback(async (pId: string) => {
    if (!pId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/patient/${pId}/doctor-instructions`);
      if (res.ok) {
        const data = await res.json();
        setDoctorFeedback(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("recura_patient") || "{}");
      setPatient(p);
      const key = `PT-P${p.id || "101"}`;
      setPatientKey(key);
      fetchDoctorResponses(key);
      const interval = setInterval(() => fetchDoctorResponses(key), 4000);
      return () => clearInterval(interval);
    } catch (e) {
      console.error(e);
    }
  }, [fetchDoctorResponses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSentDoctor(false);
    try {
      const res = await fetch("http://127.0.0.1:8000/patient/self-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patient.name || "Patient",
          ...formData,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Self-check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDoctor = async () => {
    if (!result) return;
    setSendingDoctor(true);
    try {
      const pId = patientKey || `PT-P${patient.id || "101"}`;
      const res = await fetch("http://127.0.0.1:8000/patient/submit-to-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: pId,
          patient_name: patient.name || "Anonymous Patient",
          doctor_id: patient.linked_doctor_id || 1,
          self_check_data: result,
        }),
      });

      if (res.ok) {
        setSentDoctor(true);
        fetchDoctorResponses(pId);
      }
    } catch (err) {
      console.error("Failed to send report:", err);
    } finally {
      setSendingDoctor(false);
    }
  };

  const handleDownloadPDF = (fb?: any) => {
    const reportObj = {
      patientId: fb?.patient_id || patientKey || "PT-P101",
      prediction: 0,
      recurrenceProbability: (fb?.self_check_json?.riskScore || result?.riskScore || 10) / 100,
      confidence: 0.90,
      riskLevel: fb?.self_check_json?.color === "red" ? "high" : (fb?.self_check_json?.color === "yellow" ? "medium" : "low"),
      status: fb?.self_check_json?.title || result?.title || "Thyroid Recovery Self-Check",
      timestamp: fb?.created_at || new Date().toISOString(),
    };

    generatePatientFriendlyReport(
      reportObj,
      fb?.doctor_note || "Your recovery self-check has been evaluated and logged in your clinical record.",
      fb?.appointment_time
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.85rem", background: "#E0F2FE", color: "#0369A1", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          <HeartPulse size={14} />
          Welcome, {patient.name || "Patient"}
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>Thyroid Recovery Self-Check</h1>
        <p style={{ color: "#4B5563", marginTop: "0.35rem" }}>
          Enter your blood test numbers to get AI guidance and send reports directly to your doctor.
        </p>
      </div>

      {/* Doctor Response Feed Section */}
      {doctorFeedback.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Stethoscope size={20} color="#0F766E" /> Doctor Notifications
          </h2>

          {doctorFeedback.map((fb) => {
            const isReviewed = fb.status === "REVIEWED";
            return (
              <div
                key={fb.id}
                style={{
                  background: isReviewed ? "#F0FDF4" : "#FFFBEB",
                  border: `1.5px solid ${isReviewed ? "#86EFAC" : "#FDE68A"}`,
                  borderRadius: "14px",
                  padding: "1.25rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: isReviewed ? "#DCFCE7" : "#FEF3C7",
                      color: isReviewed ? "#15803D" : "#B45309",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    {isReviewed ? <CheckCircle2 size={14} /> : <RefreshCw className="animate-spin" size={14} />}
                    {isReviewed ? "DOCTOR REPLIED" : "AWAITING DOCTOR REVIEW"}
                  </span>

                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Submitted: {fb.created_at}
                  </span>
                </div>

                {isReviewed ? (
                  <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.5rem" }}>
                      <MessageSquare size={16} color="#0F766E" /> Recommendation:
                    </div>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "#334155", lineHeight: 1.5 }}>
                      "{fb.doctor_note || "Your report is reviewed. Continue routine monitoring."}"
                    </p>

                    <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "0.5rem" }}>
                      <strong>Action:</strong> {fb.doctor_action || "REVIEWED"}
                    </div>

                    {fb.appointment_time && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#EFF6FF", color: "#1E40AF", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                        <Calendar size={16} /> Visit on {fb.appointment_time}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(fb)}
                      style={{
                        padding: "0.65rem 1.25rem",
                        background: "#0F766E",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <FileText size={16} /> Download Doctor-Signed PDF
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#78350F" }}>
                    Your self-check report was delivered to your doctor's inbox. You will receive real-time verification here once reviewed.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Input Self-Check Form */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <form onSubmit={handleSubmit} style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 8, border: "1px solid #D1D5DB", marginTop: 4 }}
            />
          </div>

          <div style={{ background: "#F9FAFB", padding: "1.25rem", borderRadius: 12, border: "1px solid #F3F4F6" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginTop: 0 }}>1. Blood Test Results</h3>
            <p style={{ fontSize: "0.8rem", color: "#6B7280" }}>
              Find <strong>Thyroglobulin (Tg)</strong> on your lab report. Normal after surgery is below 0.2 ng/mL.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Tg Level (ng/mL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tg_level}
                  onChange={(e) => setFormData({ ...formData, tg_level: Number(e.target.value) })}
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 8, border: "1px solid #D1D5DB", marginTop: 4, fontWeight: 700, color: "#0F766E" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Tg Antibodies (TgAB)</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tgab_positive: !formData.tgab_positive })}
                  style={{
                    width: "100%", padding: "0.65rem", borderRadius: 8, marginTop: 4,
                    border: `1px solid ${formData.tgab_positive ? "#FCD34D" : "#D1D5DB"}`,
                    background: formData.tgab_positive ? "#FEF3C7" : "white",
                    color: formData.tgab_positive ? "#92400E" : "#4B5563",
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {formData.tgab_positive ? "⚠️ Positive" : "✅ Normal"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>2. Symptom Check</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {[
                { key: "neck_lump", label: "New lump or swelling in neck" },
                { key: "voice_changes", label: "Persistent voice hoarseness" },
                { key: "swallowing_issue", label: "Difficulty swallowing food" },
              ].map((item) => (
                <label key={item.key} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "0.75rem",
                  borderRadius: 8, border: "1px solid #E5E7EB",
                  background: (formData as any)[item.key] ? "#EFF6FF" : "white",
                  cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
                }}>
                  <input type="checkbox" checked={(formData as any)[item.key]} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })} />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.85rem", background: "linear-gradient(135deg,#0F766E,#0D9488)",
              color: "white", border: "none", borderRadius: 10, fontWeight: 700,
              fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {loading ? "Analyzing..." : "Run Free Self-Check"}
          </button>
        </form>
      </div>

      {/* Screen Result Container */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: result.color === "green" ? "#F0FDF4" : result.color === "yellow" ? "#FFFBEB" : "#FEF2F2",
              border: `2px solid ${result.color === "green" ? "#86EFAC" : result.color === "yellow" ? "#FDE68A" : "#FCA5A5"}`,
              borderRadius: 16, padding: "2rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
              {result.color === "green" ? <CheckCircle2 size={36} color="#16A34A" />
                : result.color === "yellow" ? <AlertCircle size={36} color="#D97706" />
                : <AlertTriangle size={36} color="#DC2626" />}
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0,
                  color: result.color === "green" ? "#14532D" : result.color === "yellow" ? "#78350F" : "#7F1D1D" }}>
                  {result.title}
                </h2>
                <p style={{ color: "#374151", marginTop: 4 }}>{result.message}</p>
              </div>
            </div>

            {result.consultationSaved && (
              <div style={{ background: "white", padding: "0.85rem 1.25rem", borderRadius: 10, border: "1px solid #BBF7D0", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <DollarSign size={22} color="#16A34A" />
                <div>
                  <div style={{ fontWeight: 700, color: "#15803D", fontSize: "0.85rem" }}>Doctor Consultation Not Needed</div>
                  <div style={{ fontSize: "0.75rem", color: "#4B5563" }}>You saved an estimated <strong>{result.estimatedMoneySaved}</strong> today.</div>
                </div>
              </div>
            )}

            <div style={{ background: "white", padding: "1.25rem", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Recommended Action</div>
              <p style={{ fontWeight: 600, color: "#111827", margin: "0.25rem 0" }}>{result.recommendation}</p>
              <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", fontSize: "0.8rem", color: "#4B5563" }}>
                {result.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleSendToDoctor}
                disabled={sendingDoctor || sentDoctor}
                style={{
                  padding: "0.65rem 1.25rem",
                  background: sentDoctor ? "#16A34A" : "linear-gradient(135deg,#2563EB,#1D4ED8)",
                  color: "white", border: "none", borderRadius: 8, fontWeight: 700,
                  cursor: sentDoctor ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {sendingDoctor ? <RefreshCw className="animate-spin" size={16} /> : sentDoctor ? <Check size={16} /> : <Send size={16} />}
                {sentDoctor ? "Report Sent to Doctor!" : sendingDoctor ? "Sending..." : "Send Report to My Doctor"}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPDF()}
                style={{
                  padding: "0.65rem 1.25rem", background: "white", color: "#374151",
                  border: "1px solid #D1D5DB", borderRadius: 8, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <FileText size={16} /> Save Self-Check PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
