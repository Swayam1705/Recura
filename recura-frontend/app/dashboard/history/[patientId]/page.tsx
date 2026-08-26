"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Calendar, TrendingUp, TrendingDown, Activity,
  AlertTriangle, CheckCircle, AlertCircle, Loader2, User,
  FileText, Clock
} from "lucide-react";

interface TimelinePrediction {
  id: number;
  patient_id: string;
  age: number;
  pathology: string;
  t_stage: string;
  n_stage: string;
  risk_category: string;
  response: string;
  physical_examination: string;
  recurrence_probability: number;
  confidence: number;
  risk_level: string;
  model_version: string;
  created_at: string;
  shap_values: any[];
  input_data: any;
}

const RISK_STYLES: Record<string, any> = {
  low: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0", icon: CheckCircle, bar: "#10B981" },
  medium: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", icon: AlertCircle, bar: "#F59E0B" },
  high: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA", icon: AlertTriangle, bar: "#EF4444" },
};

export default function PatientTimelinePage() {
  const params = useParams();
  const patientId = params?.patientId as string;
  const [timeline, setTimeline] = useState<TimelinePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    const docId = (() => {
      if (typeof window === "undefined") return "";
      try {
        const stored = localStorage.getItem("recura_user");
        if (stored) {
          const user = JSON.parse(stored);
          return user?.id ? String(user.id) : "";
        }
      } catch (e) {
        console.error(e);
      }
      return "";
    })();
    const query = docId ? `?doctor_id=${docId}` : "";
    fetch(`http://127.0.0.1:8000/history/patient/${patientId}${query}`)
      .then((res) => {
        if (!res.ok) throw new Error("Patient not found");
        return res.json();
      })
      .then((data) => {
        setTimeline(data.predictions || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={32} className="animate-spin" color="#0F766E" />
      </div>
    );
  }

  if (error || timeline.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
        <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ color: "#111827", fontFamily: "var(--font-space)", fontWeight: 700, marginBottom: "0.5rem" }}>
          Patient Not Found
        </h2>
        <p style={{ color: "#6B7280", marginBottom: "1.5rem" }}>{error || "No predictions found for this patient."}</p>
        <Link href="/dashboard/history" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.625rem 1rem",
          background: "#0F766E",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}>
          <ArrowLeft size={14} />
          Back to History
        </Link>
      </div>
    );
  }

  const latest = timeline[0];
  const oldest = timeline[timeline.length - 1];
  const trend = latest.recurrence_probability - oldest.recurrence_probability;
  const isImproving = trend < 0;
  const latestStyle = RISK_STYLES[latest.risk_level.toLowerCase()] || RISK_STYLES.low;
  const LatestIcon = latestStyle.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Back link */}
      <Link href="/dashboard/history" style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        color: "#6B7280",
        textDecoration: "none",
        fontSize: "0.85rem",
        fontWeight: 500,
        width: "fit-content",
      }}>
        <ArrowLeft size={14} />
        Back to Patient History
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "1rem",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <User size={28} color="#2563EB" />
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-space)",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}>
                {patientId}
              </h1>
              <p style={{ color: "#6B7280", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {latest.age} years old · {latest.pathology} · {latest.t_stage}/{latest.n_stage}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{
              padding: "0.75rem 1rem",
              background: "#F9FAFB",
              borderRadius: "10px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "0.65rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                Total Predictions
              </p>
              <p style={{ fontFamily: "var(--font-space)", fontSize: "1.5rem", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                {timeline.length}
              </p>
            </div>
            {timeline.length > 1 && (
              <div style={{
                padding: "0.75rem 1rem",
                background: isImproving ? "#D1FAE5" : "#FEE2E2",
                borderRadius: "10px",
                textAlign: "center",
                border: `1px solid ${isImproving ? "#A7F3D0" : "#FECACA"}`,
              }}>
                <p style={{ fontSize: "0.65rem", color: isImproving ? "#065F46" : "#991B1B", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                  Risk Trend
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                  {isImproving ? <TrendingDown size={16} color="#059669" /> : <TrendingUp size={16} color="#DC2626" />}
                  <span style={{
                    fontFamily: "var(--font-space)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: isImproving ? "#059669" : "#DC2626",
                  }}>
                    {isImproving ? "" : "+"}{(trend * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Latest Assessment Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "1.5rem",
          borderRadius: "1rem",
          border: `2px solid ${latestStyle.border}`,
          background: latestStyle.bg,
          boxShadow: `0 4px 20px ${latestStyle.bar}20`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <LatestIcon size={24} color={latestStyle.text} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: latestStyle.text, fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                Latest Assessment
              </p>
              <h3 style={{
                fontFamily: "var(--font-space)",
                fontSize: "1.375rem",
                fontWeight: 700,
                color: latestStyle.text,
              }}>
                {latest.risk_level.toUpperCase()} RISK
              </h3>
              <p style={{ color: latestStyle.text, opacity: 0.8, fontSize: "0.8rem", marginTop: "2px", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Clock size={11} />
                {new Date(latest.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontFamily: "var(--font-space)",
              fontSize: "2.5rem",
              fontWeight: 700,
              color: latestStyle.text,
              lineHeight: 1,
            }}>
              {(latest.recurrence_probability * 100).toFixed(1)}%
            </p>
            <p style={{ fontSize: "0.75rem", color: latestStyle.text, opacity: 0.8, marginTop: "0.375rem" }}>
              Recurrence Probability
            </p>
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <div>
        <h2 style={{
          fontFamily: "var(--font-space)",
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <Activity size={18} color="#0F766E" />
          Prediction Timeline ({timeline.length})
        </h2>

        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: "16px",
            top: "20px",
            bottom: "20px",
            width: "2px",
            background: "#E5E7EB",
          }} />

          {timeline.map((pred, i) => {
            const style = RISK_STYLES[pred.risk_level.toLowerCase()] || RISK_STYLES.low;
            const Icon = style.icon;
            return (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  position: "relative",
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "white",
                  border: `3px solid ${style.bar}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  <Icon size={16} color={style.text} />
                </div>

                {/* Card */}
                <div style={{
                  flex: 1,
                  background: "white",
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          background: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          borderRadius: "9999px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}>
                          {pred.risk_level}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#6B7280", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar size={10} />
                          {new Date(pred.created_at).toLocaleString()}
                        </span>
                        {i === 0 && (
                          <span style={{
                            padding: "0.15rem 0.4rem",
                            background: "#0F766E",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                          }}>
                            LATEST
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#4B5563" }}>
                        <strong>Response:</strong> {pred.response} · <strong>Exam:</strong> {pred.physical_examination}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{
                        fontFamily: "var(--font-space)",
                        fontSize: "1.375rem",
                        fontWeight: 700,
                        color: style.text,
                        lineHeight: 1,
                      }}>
                        {(pred.recurrence_probability * 100).toFixed(1)}%
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "#6B7280", marginTop: "2px" }}>
                        Confidence: {(pred.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    marginTop: "0.75rem",
                    width: "100%",
                    height: "6px",
                    background: "#F3F4F6",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pred.recurrence_probability * 100}%`,
                      height: "100%",
                      background: style.bar,
                      borderRadius: "9999px",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}