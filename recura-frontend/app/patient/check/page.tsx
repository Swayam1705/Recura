"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, AlertTriangle, Calendar, Check, CheckCircle2, DollarSign,
  FileText, HeartPulse, MessageSquare, RefreshCw, Send, ShieldCheck, Stethoscope
} from "lucide-react";

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
  const [printDoc, setPrintDoc] = useState<any>(null);

  const fetchDoctorResponses = useCallback(async (pId: string) => {
    if (!pId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/patient/${pId}/doctor-instructions`);
      if (!res.ok) return;
      const data = await res.json();
      setDoctorFeedback(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("recura_patient") || "{}");
      setPatient(p);
      const key = `PT-P${p.id || "101"}`;
      setPatientKey(key);
      fetchDoctorResponses(key);
      const t = setInterval(() => fetchDoctorResponses(key), 4000);
      return () => clearInterval(t);
    } catch {}
  }, [fetchDoctorResponses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSentDoctor(false);
    try {
      const res = await fetch("http://127.0.0.1:8000/patient/self-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_name: patient.name || "Patient", ...formData }),
      });
      setResult(await res.json());
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
          patient_name: patient.name || "Patient",
          doctor_id: patient.linked_doctor_id || 1,
          self_check_data: result,
        }),
      });
      if (res.ok) {
        setSentDoctor(true);
        fetchDoctorResponses(pId);
      }
    } finally {
      setSendingDoctor(false);
    }
  };

  // Build a dedicated printable certificate, then print
  const downloadDoctorPdf = (fb: any) => {
    setPrintDoc({
      patientName: patient.name || fb.patient_name || "Patient",
      patientId: fb.patient_id || patientKey,
      doctorNote: fb.doctor_note || "Reviewed and recorded.",
      action: fb.doctor_action || "REVIEWED",
      appointment: fb.appointment_time || "",
      reviewedAt: fb.reviewed_at || fb.created_at || new Date().toLocaleString(),
      selfCheck: fb.self_check_json || result || {},
    });
    setTimeout(() => window.print(), 250);
  };

  const downloadSelfCheckPdf = () => {
    if (!result) return;
    setPrintDoc({
      patientName: patient.name || "Patient",
      patientId: patientKey,
      doctorNote: "Self-check only (not yet doctor-signed).",
      action: "SELF_CHECK",
      appointment: "",
      reviewedAt: new Date().toLocaleString(),
      selfCheck: result,
    });
    setTimeout(() => window.print(), 250);
  };

  const reviewedCount = doctorFeedback.filter((x) => x.status === "REVIEWED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* SCREEN UI */}
      <div className="no-print">
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", background: "#E0F2FE", color: "#0369A1", borderRadius: 999, padding: "0.3rem 0.75rem", fontWeight: 700, fontSize: 13 }}>
          <HeartPulse size={14} /> Welcome, {patient.name || "Patient"}
        </div>
        <h1 style={{ margin: "0.55rem 0 0.2rem", fontSize: "1.9rem", fontWeight: 800 }}>Thyroid Recovery Self-Check</h1>
        <p style={{ margin: 0, color: "#64748B" }}>Run check → send to doctor → receive recommendation + signed PDF.</p>
        {reviewedCount > 0 && (
          <div style={{ marginTop: 10, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", borderRadius: 10, padding: "0.65rem 0.85rem", fontWeight: 700 }}>
            You have {reviewedCount} doctor recommendation(s)
          </div>
        )}
      </div>

      {doctorFeedback.length > 0 && (
        <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ margin: 0, display: "flex", gap: 8, alignItems: "center", fontSize: "1.15rem" }}>
            <Stethoscope size={18} color="#0F766E" /> Doctor Notifications
          </h2>
          {doctorFeedback.map((fb) => {
            const reviewed = fb.status === "REVIEWED";
            return (
              <div key={fb.id} style={{ background: reviewed ? "#F0FDF4" : "#FFFBEB", border: `1px solid ${reviewed ? "#86EFAC" : "#FDE68A"}`, borderRadius: 12, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong>{reviewed ? "Doctor Replied" : "Waiting for Doctor"}</strong>
                  <span style={{ fontSize: 12, color: "#64748B" }}>{fb.created_at}</span>
                </div>
                {!reviewed ? (
                  <p style={{ margin: "0.5rem 0 0", color: "#92400E" }}>Your report is in the doctor inbox.</p>
                ) : (
                  <div style={{ marginTop: 8, background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "0.8rem" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 700 }}><MessageSquare size={15} /> Recommendation</div>
                    <p style={{ margin: "0.4rem 0" }}>{fb.doctor_note || "Reviewed and recorded."}</p>
                    <div style={{ fontSize: 13, color: "#475569" }}><b>Action:</b> {fb.doctor_action || "REVIEWED"}</div>
                    {fb.appointment_time && (
                      <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", color: "#1D4ED8", fontWeight: 700 }}>
                        <Calendar size={14} /> {fb.appointment_time}
                      </div>
                    )}
                    <button type="button" onClick={() => downloadDoctorPdf(fb)} style={{ marginTop: 10, border: "none", background: "#0F766E", color: "white", borderRadius: 8, padding: "0.5rem 0.8rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <FileText size={14} /> Download Doctor-Signed PDF
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="no-print" style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "1.2rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Age</label>
            <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })} style={{ width: "100%", marginTop: 4, padding: 10, borderRadius: 8, border: "1px solid #CBD5E1" }} />
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 800 }}>Blood Test</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700 }}>Tg (ng/mL)</label>
                <input type="number" step="0.01" value={formData.tg_level} onChange={(e) => setFormData({ ...formData, tg_level: Number(e.target.value) })} style={{ width: "100%", marginTop: 4, padding: 10, borderRadius: 8, border: "1px solid #CBD5E1" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700 }}>TgAB</label>
                <button type="button" onClick={() => setFormData({ ...formData, tgab_positive: !formData.tgab_positive })} style={{ width: "100%", marginTop: 4, padding: 10, borderRadius: 8, border: "1px solid #CBD5E1", background: formData.tgab_positive ? "#FEF3C7" : "white", fontWeight: 700, cursor: "pointer" }}>
                  {formData.tgab_positive ? "Positive" : "Normal"}
                </button>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Symptoms</div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                ["neck_lump", "New neck lump/swelling"],
                ["voice_changes", "Voice hoarseness"],
                ["swallowing_issue", "Swallowing difficulty"],
              ].map(([k, label]) => (
                <label key={k} style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
                  <input type="checkbox" checked={(formData as any)[k]} onChange={(e) => setFormData({ ...formData, [k]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ border: "none", borderRadius: 10, padding: "0.8rem", background: "linear-gradient(135deg,#0F766E,#0D9488)", color: "white", fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", gap: 8 }}>
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            {loading ? "Analyzing..." : "Run Free Self-Check"}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div className="no-print" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ borderRadius: 14, padding: "1.2rem", background: result.color === "green" ? "#F0FDF4" : result.color === "yellow" ? "#FFFBEB" : "#FEF2F2", border: `1px solid ${result.color === "green" ? "#86EFAC" : result.color === "yellow" ? "#FDE68A" : "#FCA5A5"}` }}>
            <div style={{ display: "flex", gap: 10 }}>
              {result.color === "green" ? <CheckCircle2 color="#16A34A" /> : result.color === "yellow" ? <AlertCircle color="#D97706" /> : <AlertTriangle color="#DC2626" />}
              <div>
                <h3 style={{ margin: 0 }}>{result.title}</h3>
                <p style={{ margin: "0.35rem 0 0" }}>{result.message}</p>
              </div>
            </div>
            {result.consultationSaved && (
              <div style={{ marginTop: 10, background: "white", borderRadius: 10, padding: "0.7rem 0.85rem", display: "flex", gap: 8, alignItems: "center" }}>
                <DollarSign size={16} color="#16A34A" />
                <span>Estimated savings: <b>{result.estimatedMoneySaved}</b></span>
              </div>
            )}
            <div style={{ marginTop: 10, background: "white", borderRadius: 10, padding: "0.85rem" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B" }}>RECOMMENDED ACTION</div>
              <div style={{ fontWeight: 700 }}>{result.recommendation}</div>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: 18 }}>
                {(result.reasons || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={handleSendToDoctor} disabled={sendingDoctor || sentDoctor} style={{ border: "none", borderRadius: 8, padding: "0.6rem 0.9rem", background: sentDoctor ? "#16A34A" : "#2563EB", color: "white", fontWeight: 800, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                {sendingDoctor ? <RefreshCw className="animate-spin" size={14} /> : sentDoctor ? <Check size={14} /> : <Send size={14} />}
                {sentDoctor ? "Sent to Doctor" : "Send Report to Doctor"}
              </button>
              <button type="button" onClick={downloadSelfCheckPdf} style={{ border: "1px solid #CBD5E1", borderRadius: 8, padding: "0.6rem 0.9rem", background: "white", fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                <FileText size={14} /> Save Self-Check PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT-ONLY CERTIFICATE (this is what becomes the PDF) */}
      {printDoc && (
        <div id="doctor-signed-print" className="print-only" style={{ display: "none", background: "white", color: "#0F172A", padding: 24, fontFamily: "Arial, sans-serif" }}>
          <div style={{ border: "2px solid #0F766E", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F766E" }}>Recura Clinical Report</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Doctor-Verified Patient Self-Check Summary</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#64748B" }}>
                <div>Generated: {new Date().toLocaleString()}</div>
                <div>Reviewed: {printDoc.reviewedAt}</div>
              </div>
            </div>

            <div style={{ marginBottom: 14, padding: 12, background: "#F8FAFC", borderRadius: 8 }}>
              <div><b>Patient:</b> {printDoc.patientName}</div>
              <div><b>Patient ID:</b> {printDoc.patientId}</div>
              <div><b>Doctor Action:</b> {printDoc.action}</div>
              {printDoc.appointment ? <div><b>Follow-up:</b> {printDoc.appointment}</div> : null}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Self-Check Summary</div>
              <div><b>Status:</b> {printDoc.selfCheck?.title || printDoc.selfCheck?.status || "N/A"}</div>
              <div style={{ marginTop: 4 }}>{printDoc.selfCheck?.message || ""}</div>
              <div style={{ marginTop: 4 }}><b>Recommendation:</b> {printDoc.selfCheck?.recommendation || "N/A"}</div>
              <div style={{ marginTop: 4 }}><b>Risk Score:</b> {printDoc.selfCheck?.riskScore ?? "N/A"}</div>
              <ul>
                {(printDoc.selfCheck?.reasons || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div style={{ marginBottom: 14, padding: 12, border: "1px solid #A7F3D0", background: "#F0FDF4", borderRadius: 8 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Doctor Recommendation</div>
              <div style={{ fontSize: 15, lineHeight: 1.5 }}>{printDoc.doctorNote}</div>
            </div>

            <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B" }}>
              <div>
                <div style={{ borderTop: "1px solid #94A3B8", width: 180, marginBottom: 4 }} />
                Doctor Digital Acknowledgement
              </div>
              <div>
                <div style={{ borderTop: "1px solid #94A3B8", width: 180, marginBottom: 4 }} />
                Recura Patient Companion
              </div>
            </div>

            <p style={{ marginTop: 18, fontSize: 11, color: "#94A3B8" }}>
              This document is a clinical communication aid and not an emergency medical service.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
