"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Calendar, User, Activity, AlertTriangle, CheckCircle,
  Brain, Clock, FileText, Stethoscope, Loader2, Database, ShieldAlert
} from "lucide-react";

interface RecordItem {
  id: number | string;
  patient_id: string;
  age?: number;
  pathology?: string;
  t_stage?: string;
  n_stage?: string;
  risk_category?: string;
  response?: string;
  physical_examination?: string;
  recurrence_probability?: number;
  confidence?: number;
  risk_level?: string;
  model_version?: string;
  shap_values?: Array<{ feature: string; value: any; impact: number; direction: string }>;
  input_data?: any;
  doctor_note?: string;
  doctor_action?: string;
  appointment_time?: string;
  created_at: string;
  record_type?: string;
}

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  low: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0", dot: "#10B981" },
  medium: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", dot: "#F59E0B" },
  high: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA", dot: "#EF4444" },
};

function getDoctorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem("recura_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) return String(user.id);
    }
  } catch (e) {
    console.error(e);
  }
  return "";
}

export default function PatientTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const rawPatientId = params?.patientId as string;
  const patientId = rawPatientId ? decodeURIComponent(rawPatientId) : "";

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const docId = getDoctorId();
      const query = docId ? `?doctor_id=${docId}` : "";
      
      const res = await fetch(`http://127.0.0.1:8000/history/patient/${encodeURIComponent(patientId)}${query}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.predictions || data.timeline || []);
        setRecords(list);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Failed to load patient timeline:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const latestRecord = records[0];
  const patientAge = latestRecord?.age || "N/A";
  const patientPathology = latestRecord?.pathology || "Thyroid Evaluation";
  const latestRisk = (latestRecord?.risk_level || "low").toLowerCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Top Header & Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#4B5563",
              cursor: "pointer",
              marginBottom: "0.75rem",
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <User size={28} color="#0F766E" />
            Patient History Timeline: <span style={{ fontFamily: "monospace", color: "#0F766E" }}>{patientId}</span>
          </h1>
        </div>

        {latestRecord && (
          <span style={{
            padding: "0.4rem 1rem",
            background: (RISK_STYLES[latestRisk] || RISK_STYLES.low).bg,
            color: (RISK_STYLES[latestRisk] || RISK_STYLES.low).text,
            border: `1px solid ${(RISK_STYLES[latestRisk] || RISK_STYLES.low).border}`,
            borderRadius: "9999px",
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: (RISK_STYLES[latestRisk] || RISK_STYLES.low).dot }} />
            Latest Status: {latestRisk} Risk
          </span>
        )}
      </motion.div>

      {/* Patient Summary Header Card */}
      <div style={{
        background: "white",
        borderRadius: "14px",
        border: "1px solid #E5E7EB",
        padding: "1.25rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Patient ID</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace", color: "#111827" }}>{patientId}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Age</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{patientAge} yrs</div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Pathology Variant</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{patientPathology}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Total Records</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F766E" }}>{records.length} evaluation(s)</div>
        </div>
      </div>

      {/* Timeline Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: "0.5rem 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity size={20} color="#0F766E" /> Longitudinal Care History
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <Loader2 size={28} className="animate-spin" color="#0F766E" style={{ margin: "0 auto 0.5rem" }} />
            <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: 0 }}>Loading patient history records...</p>
          </div>
        ) : records.length === 0 ? (
          <div style={{ background: "white", padding: "3rem", borderRadius: "12px", border: "1px solid #E5E7EB", textAlign: "center" }}>
            <ShieldAlert size={36} color="#D1D5DB" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>No History Records Found</h3>
            <p style={{ color: "#6B7280", fontSize: "0.85rem", margin: 0 }}>
              No previous AI predictions or self-check reports exist for patient ID <strong style={{ fontFamily: "monospace" }}>{patientId}</strong>.
            </p>
          </div>
        ) : (
          records.map((rec, index) => {
            const risk = (rec.risk_level || "low").toLowerCase();
            const style = RISK_STYLES[risk] || RISK_STYLES.low;
            const isSelfCheck = rec.record_type === "patient_review" || rec.pathology?.includes("Self-Check");

            return (
              <motion.div
                key={rec.id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                style={{
                  background: "white",
                  borderRadius: "14px",
                  border: `1.5px solid ${style.border}`,
                  padding: "1.25rem 1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      padding: "0.25rem 0.65rem",
                      background: isSelfCheck ? "#E0F2FE" : "#EFF6FF",
                      color: isSelfCheck ? "#0369A1" : "#1D4ED8",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}>
                      {isSelfCheck ? <Stethoscope size={13} /> : <Brain size={13} />}
                      {isSelfCheck ? "PATIENT SELF-CHECK REPORT" : "CLINICAL AI PREDICTION"}
                    </span>

                    <span style={{
                      padding: "0.2rem 0.55rem",
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase"
                    }}>
                      {risk} RISK
                    </span>
                  </div>

                  <span style={{ fontSize: "0.75rem", color: "#6B7280", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <Calendar size={12} />
                    {new Date(rec.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Score & Main Info */}
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "baseline", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  {rec.recurrence_probability !== undefined && (
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: style.text }}>
                      {(rec.recurrence_probability * 100).toFixed(1)}% <span style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 500 }}>Recurrence Score</span>
                    </div>
                  )}
                  {rec.response && (
                    <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                      <strong>Response:</strong> {rec.response}
                    </div>
                  )}
                  {rec.t_stage && rec.t_stage !== "N/A" && (
                    <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                      <strong>T/N Staging:</strong> {rec.t_stage} / {rec.n_stage}
                    </div>
                  )}
                </div>

                {/* Doctor Note / Action if present */}
                {rec.doctor_note && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#15803D", marginBottom: "0.2rem" }}>
                      🩺 Doctor Advice & Verification:
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#14532D", lineHeight: 1.4 }}>
                      "{rec.doctor_note}"
                    </p>
                    {rec.appointment_time && (
                      <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "#1E40AF" }}>
                        🗓️ Scheduled Follow-up: {rec.appointment_time}
                      </div>
                    )}
                  </div>
                )}

                {/* SHAP Feature Driver Breakdown */}
                {rec.shap_values && rec.shap_values.length > 0 && (
                  <div style={{ background: "#F8FAFC", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                      Key Feature Impact Factors (SHAP Analysis)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
                      {rec.shap_values.slice(0, 4).map((s, i) => (
                        <div key={i} style={{ fontSize: "0.8rem", display: "flex", justifyContent: "space-between", background: "white", padding: "0.35rem 0.6rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                          <span style={{ fontWeight: 600, color: "#334155" }}>{s.feature}: {s.value}</span>
                          <span style={{ fontWeight: 700, color: s.direction === "positive" ? "#DC2626" : "#059669" }}>
                            {s.direction === "positive" ? "+" : "-"}{(s.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
