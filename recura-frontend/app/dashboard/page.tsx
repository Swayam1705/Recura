"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  ShieldCheck,
  Brain,
  FileText,
  CheckCircle,
} from "lucide-react";

interface Stats {
  total_predictions: number;
  unique_patients: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  avg_risk_score: number;
  recent_7_days: number;
}

interface Prediction {
  id: number;
  patient_id: string;
  age: number;
  pathology: string;
  t_stage: string;
  n_stage: string;
  risk_category: string;
  recurrence_probability: number;
  risk_level: string;
  created_at: string;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  medium: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  low: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
};

export default function DashboardOverview() {
  const [doctorName, setDoctorName] = useState("Doctor");
  const [hospital, setHospital] = useState("");
  const [doctorId, setDoctorId] = useState<number | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Read logged-in doctor on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("recura_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setDoctorName(user.name || "Doctor");
        if (user.hospital) setHospital(user.hospital);
        if (user.id) setDoctorId(Number(user.id));
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
  }, []);

  // Fetch live stats and recent predictions filtered by doctor_id
  const loadDashboardData = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/history/stats?doctor_id=${doctorId}`),
        fetch(`http://127.0.0.1:8000/history?doctor_id=${doctorId}&per_page=5`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setRecentPredictions(historyData.predictions || []);
      }
    } catch (e) {
      console.error("Failed to load overview data:", e);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      loadDashboardData();
    }
  }, [doctorId, loadDashboardData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Top Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "white",
          padding: "1.5rem 1.75rem",
          borderRadius: "1rem",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 600 }}>
              CLINICAL WORKSPACE
            </span>
            {hospital && (
              <span style={{
                fontSize: "0.7rem",
                padding: "2px 8px",
                background: "#EFF6FF",
                color: "#1D4ED8",
                borderRadius: "9999px",
                fontWeight: 700,
                border: "1px solid #DBEAFE",
              }}>
                {hospital}
              </span>
            )}
          </div>
          <h1 style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            fontWeight: 800,
            color: "#111827",
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            Welcome back, {doctorName}
          </h1>
          <p style={{ color: "#6B7280", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Here is your live recurrence risk overview and recent patient activity.
          </p>
        </div>

        <Link
          href="/dashboard/predict"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            color: "white",
            borderRadius: "0.75rem",
            fontWeight: 700,
            fontSize: "0.875rem",
            textDecoration: "none",
            boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)",
            transition: "all 0.2s",
          }}
        >
          <Plus size={18} />
          New Prediction
        </Link>
      </motion.div>

      {/* Stats Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
      }}>
        {[
          {
            title: "Total Predictions",
            value: stats ? stats.total_predictions : 0,
            icon: Brain,
            color: "#2563EB",
            bg: "#EFF6FF",
          },
          {
            title: "Unique Patients",
            value: stats ? stats.unique_patients : 0,
            icon: Users,
            color: "#7C3AED",
            bg: "#F5F3FF",
          },
          {
            title: "High Risk",
            value: stats ? stats.high_risk : 0,
            icon: AlertTriangle,
            color: "#DC2626",
            bg: "#FEF2F2",
          },
          {
            title: "Medium Risk",
            value: stats ? stats.medium_risk : 0,
            icon: TrendingUp,
            color: "#D97706",
            bg: "#FEF3C7",
          },
          {
            title: "Avg Risk Score",
            value: stats ? `${(stats.avg_risk_score * 100).toFixed(1)}%` : "0.0%",
            icon: Activity,
            color: "#059669",
            bg: "#ECFDF5",
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                padding: "1.25rem",
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.875rem",
              }}>
                <Icon size={20} color={card.color} />
              </div>
              <p style={{
                fontFamily: "var(--font-space)",
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#111827",
                margin: 0,
                lineHeight: 1,
              }}>
                {loading ? "-" : card.value}
              </p>
              <p style={{
                fontSize: "0.75rem",
                color: "#6B7280",
                marginTop: "0.375rem",
                fontWeight: 600,
                margin: "0.375rem 0 0",
              }}>
                {card.title}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Action Shortcut Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
        borderRadius: "1rem",
        padding: "1.5rem 1.75rem",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 10px 25px rgba(15, 118, 110, 0.25)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              AI Assistant Ready
            </span>
          </div>
          <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
            Parse Clinical Notes in Seconds
          </h3>
          <p style={{ fontSize: "0.875rem", opacity: 0.9, margin: 0, maxWidth: "600px" }}>
            Paste unstructured doctor notes to auto-extract TNM stages, pathology, and Tg responses directly into the prediction form.
          </p>
        </div>
        <Link
          href="/dashboard/predict"
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: "white",
            color: "#0F766E",
            borderRadius: "0.75rem",
            fontWeight: 700,
            fontSize: "0.875rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          Try AI Note Parser <ArrowRight size={16} />
        </Link>
      </div>

      {/* Recent Predictions Table Section */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "1rem",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h3 style={{
              fontFamily: "var(--font-space)",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#111827",
              margin: 0,
            }}>
              Recent Patient Activity
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.8rem", margin: "2px 0 0" }}>
              Latest recurrence risk assessments in your workspace
            </p>
          </div>
          <Link
            href="/dashboard/history"
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#2563EB",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            View All History <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                {["Patient ID", "Age", "Pathology", "T/N Stage", "Risk Level", "Probability", "Date", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 1.25rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                    Loading patient activity...
                  </td>
                </tr>
              ) : recentPredictions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center" }}>
                    <FileText size={32} color="#CBD5E1" style={{ margin: "0 auto 0.75rem" }} />
                    <p style={{ color: "#64748B", fontSize: "0.9rem", margin: 0, fontWeight: 600 }}>
                      No patients in your workspace yet
                    </p>
                    <p style={{ color: "#94A3B8", fontSize: "0.8rem", margin: "0.25rem 0 1rem" }}>
                      Run your first prediction to start tracking recurrence risks.
                    </p>
                    <Link
                      href="/dashboard/predict"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#2563EB",
                        color: "white",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      <Plus size={14} /> Run First Prediction
                    </Link>
                  </td>
                </tr>
              ) : (
                recentPredictions.map((p) => {
                  const levelKey = p.risk_level.toLowerCase();
                  const style = RISK_COLORS[levelKey] || RISK_COLORS.low;
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{
                        padding: "0.875rem 1.25rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "#0F172A",
                      }}>
                        {p.patient_id}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.85rem", color: "#334155" }}>
                        {p.age} yrs
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.85rem", color: "#334155" }}>
                        {p.pathology}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.85rem", color: "#334155" }}>
                        {p.t_stage} / {p.n_stage}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                        }}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td style={{
                        padding: "0.875rem 1.25rem",
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        color: style.text,
                      }}>
                        {(p.recurrence_probability * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "#64748B" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar size={12} />
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <Link
                          href={`/dashboard/history/${p.patient_id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.35rem 0.65rem",
                            backgroundColor: "#F1F5F9",
                            color: "#334155",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          Timeline
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}