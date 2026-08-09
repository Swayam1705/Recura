"use client";

import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Total Predictions",
    value: "1,284",
    change: "+12%",
    subtitle: "vs last week",
    icon: Brain,
    gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    label: "High Risk Patients",
    value: "143",
    change: "+3",
    subtitle: "new today",
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, #EF4444, #F97316)",
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
  },
  {
    label: "Active Doctors",
    value: "38",
    change: "5",
    subtitle: "hospitals connected",
    icon: Users,
    gradient: "linear-gradient(135deg, #10B981, #14B8A6)",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
  },
  {
    label: "Reports Generated",
    value: "892",
    change: "+24",
    subtitle: "this week",
    icon: FileText,
    gradient: "linear-gradient(135deg, #8B5CF6, #EC4899)",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
  },
];

const recentPredictions = [
  { id: "PT-1284", name: "Patient #1284", age: 52, risk: "high", probability: 87, date: "Today, 09:14 AM", doctor: "Dr. Swayam" },
  { id: "PT-1283", name: "Patient #1283", age: 45, risk: "low", probability: 23, date: "Today, 08:52 AM", doctor: "Dr. Swayam" },
  { id: "PT-1282", name: "Patient #1282", age: 61, risk: "medium", probability: 54, date: "Yesterday, 04:30 PM", doctor: "Dr. Patel" },
  { id: "PT-1281", name: "Patient #1281", age: 38, risk: "low", probability: 18, date: "Yesterday, 02:15 PM", doctor: "Dr. Swayam" },
  { id: "PT-1280", name: "Patient #1280", age: 57, risk: "high", probability: 91, date: "Yesterday, 11:00 AM", doctor: "Dr. Kumar" },
];

const riskColors = {
  low: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", bar: "#10B981" },
  medium: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D", bar: "#F59E0B" },
  high: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", bar: "#EF4444" },
};

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6B7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            <Calendar size={14} />
            {today}
          </div>
          <h1 style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: "700",
            color: "#111827",
            letterSpacing: "-0.02em",
          }}>
            Good Morning, Dr. Swayam
          </h1>
          <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
            Here is your clinical overview for today.
          </p>
        </div>
        <Link
          href="/dashboard/predict"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 1.5rem",
            background: "linear-gradient(to right, #3B82F6, #1D4ED8)",
            borderRadius: "12px",
            color: "white",
            fontWeight: "700",
            fontSize: "0.875rem",
            textDecoration: "none",
            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.35)",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(59, 130, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 10px 25px rgba(59, 130, 246, 0.35)";
          }}
        >
          <Brain size={16} />
          New Prediction
          <ArrowRight size={14} />
        </Link>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.25rem",
      }}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            whileHover={{
              y: -4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "150px",
              height: "150px",
              background: stat.gradient,
              opacity: 0.05,
              borderRadius: "50%",
              transform: "translate(50%, -50%)",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem", position: "relative" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: stat.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <stat.icon size={22} color={stat.iconColor} strokeWidth={2} />
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.75rem",
                fontWeight: "700",
                padding: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#ECFDF5",
                color: "#059669",
              }}>
                <ArrowUpRight size={12} />
                {stat.change}
              </div>
            </div>
            <p style={{
              fontFamily: "var(--font-space)",
              fontSize: "2rem",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "4px",
              letterSpacing: "-0.02em",
            }}>
              {stat.value}
            </p>
            <p style={{ color: "#4B5563", fontSize: "0.875rem", fontWeight: "500" }}>{stat.label}</p>
            <p style={{ color: "#9CA3AF", fontSize: "0.75rem", marginTop: "4px" }}>{stat.subtitle}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "1rem",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #F3F4F6",
        }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-space)",
              fontWeight: "700",
              color: "#111827",
              fontSize: "1.125rem",
            }}>
              Recent Predictions
            </h2>
            <p style={{ color: "#6B7280", fontSize: "0.875rem", marginTop: "2px" }}>
              Latest patient recurrence assessments
            </p>
          </div>
          <Link
            href="/dashboard/reports"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#2563EB",
              fontSize: "0.875rem",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                {["Patient", "Age", "Risk Level", "Probability", "Doctor", "Date", "Action"].map((h, i) => (
                  <th key={h} style={{
                    padding: "12px 24px",
                    textAlign: i === 6 ? "right" : "left",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPredictions.map((pred, i) => {
                const rc = riskColors[pred.risk as keyof typeof riskColors];
                return (
                  <motion.tr
                    key={pred.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}>
                          {pred.id.split("-")[1].slice(-2)}
                        </div>
                        <div>
                          <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: "600" }}>{pred.name}</div>
                          <div style={{ color: "#6B7280", fontSize: "0.75rem" }}>{pred.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#4B5563", fontSize: "0.875rem" }}>{pred.age} years</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        display: "inline-flex",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "capitalize",
                        backgroundColor: rc.bg,
                        color: rc.text,
                        border: `1px solid ${rc.border}`,
                      }}>
                        {pred.risk}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "96px",
                          backgroundColor: "#F3F4F6",
                          borderRadius: "9999px",
                          height: "8px",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%",
                            borderRadius: "9999px",
                            backgroundColor: rc.bar,
                            width: `${pred.probability}%`,
                          }} />
                        </div>
                        <span style={{ color: "#111827", fontSize: "0.875rem", fontWeight: "600", minWidth: "3ch" }}>
                          {pred.probability}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#4B5563", fontSize: "0.875rem" }}>{pred.doctor}</td>
                    <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "0.875rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={12} />
                        {pred.date}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button style={{
                        color: "#2563EB",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}>
                        View →
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
          border: "1px solid #DBEAFE",
          borderRadius: "1rem",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(59, 130, 246, 0.35)",
          flexShrink: 0,
        }}>
          <Sparkles size={26} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <h3 style={{ color: "#111827", fontWeight: "700", fontSize: "1rem", marginBottom: "2px" }}>
            AI Insight: 12 patients need follow-up this week
          </h3>
          <p style={{ color: "#4B5563", fontSize: "0.875rem" }}>
            Based on recurrence probability trends across your recent predictions.
          </p>
        </div>
        <button style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: "white",
          border: "1px solid #DBEAFE",
          borderRadius: "12px",
          color: "#2563EB",
          fontWeight: "600",
          fontSize: "0.875rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          View Insights
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}