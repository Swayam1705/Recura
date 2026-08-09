"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Search, Filter, Calendar } from "lucide-react";

const reports = [
  { id: "PT-1284", patient: "Patient #1284", age: 52, riskLevel: "high", probability: 87, confidence: 94, date: "Aug 5, 2026", doctor: "Dr. Swayam" },
  { id: "PT-1283", patient: "Patient #1283", age: 45, riskLevel: "low", probability: 23, confidence: 91, date: "Aug 5, 2026", doctor: "Dr. Swayam" },
  { id: "PT-1282", patient: "Patient #1282", age: 61, riskLevel: "medium", probability: 54, confidence: 88, date: "Aug 4, 2026", doctor: "Dr. Patel" },
  { id: "PT-1281", patient: "Patient #1281", age: 38, riskLevel: "low", probability: 18, confidence: 96, date: "Aug 4, 2026", doctor: "Dr. Swayam" },
  { id: "PT-1280", patient: "Patient #1280", age: 57, riskLevel: "high", probability: 91, confidence: 93, date: "Aug 4, 2026", doctor: "Dr. Kumar" },
  { id: "PT-1279", patient: "Patient #1279", age: 49, riskLevel: "medium", probability: 61, confidence: 87, date: "Aug 3, 2026", doctor: "Dr. Swayam" },
  { id: "PT-1278", patient: "Patient #1278", age: 43, riskLevel: "low", probability: 15, confidence: 92, date: "Aug 3, 2026", doctor: "Dr. Patel" },
  { id: "PT-1277", patient: "Patient #1277", age: 55, riskLevel: "high", probability: 83, confidence: 89, date: "Aug 2, 2026", doctor: "Dr. Kumar" },
];

const riskColors = {
  low: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", bar: "#10B981" },
  medium: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D", bar: "#F59E0B" },
  high: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", bar: "#EF4444" },
};

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.riskLevel === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: reports.length,
    high: reports.filter((r) => r.riskLevel === "high").length,
    medium: reports.filter((r) => r.riskLevel === "medium").length,
    low: reports.filter((r) => r.riskLevel === "low").length,
  };

  const statCards = [
    { label: "Total Reports", value: stats.total, color: "#111827", borderColor: "#E5E7EB" },
    { label: "High Risk", value: stats.high, color: "#DC2626", borderColor: "#FECACA" },
    { label: "Medium Risk", value: stats.medium, color: "#D97706", borderColor: "#FCD34D" },
    { label: "Low Risk", value: stats.low, color: "#059669", borderColor: "#A7F3D0" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: "700",
            color: "#111827",
            letterSpacing: "-0.02em",
          }}>
            Clinical Reports
          </h1>
          <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
            View, filter, and export all prediction reports.
          </p>
        </div>
        <button style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 1.5rem",
          background: "linear-gradient(to right, #3B82F6, #1D4ED8)",
          borderRadius: "12px",
          color: "white",
          fontWeight: "700",
          fontSize: "0.875rem",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(59, 130, 246, 0.35)",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <Download size={16} />
          Export All Reports
        </button>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem",
      }}>
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              backgroundColor: "white",
              border: `1px solid ${s.borderColor}`,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <p style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              color: s.color,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "0.75rem",
            }}>
              {s.label}
            </p>
            <p style={{
              fontFamily: "var(--font-space)",
              fontSize: "2rem",
              fontWeight: "700",
              color: s.color,
              letterSpacing: "-0.02em",
            }}>
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
          <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Search by patient ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "2.75rem",
              paddingRight: "1rem",
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
              borderRadius: "12px",
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              color: "#111827",
              fontSize: "0.875rem",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3B82F6";
              e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E5E7EB";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "4px",
        }}>
          <Filter size={14} style={{ color: "#9CA3AF", marginLeft: "0.5rem" }} />
          {["all", "low", "medium", "high"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "600",
                textTransform: "capitalize",
                border: "none",
                cursor: "pointer",
                backgroundColor: filter === f ? "#2563EB" : "transparent",
                color: filter === f ? "white" : "#4B5563",
                boxShadow: filter === f ? "0 4px 8px rgba(37, 99, 235, 0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "1rem",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                {["Patient", "Age", "Risk Level", "Probability", "Confidence", "Doctor", "Date", "Actions"].map((h, i) => (
                  <th key={h} style={{
                    padding: "14px 24px",
                    textAlign: i === 7 ? "right" : "left",
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
              {filtered.map((r, i) => {
                const rc = riskColors[r.riskLevel as keyof typeof riskColors];
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
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
                          {r.id.split("-")[1].slice(-2)}
                        </div>
                        <div>
                          <div style={{ color: "#111827", fontSize: "0.875rem", fontWeight: "600" }}>{r.patient}</div>
                          <div style={{ color: "#6B7280", fontSize: "0.75rem" }}>{r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#4B5563", fontSize: "0.875rem" }}>{r.age} years</td>
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
                        {r.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "80px", backgroundColor: "#F3F4F6", borderRadius: "9999px", height: "8px", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: "9999px", backgroundColor: rc.bar, width: `${r.probability}%` }} />
                        </div>
                        <span style={{ color: "#111827", fontSize: "0.875rem", fontWeight: "600", minWidth: "3ch" }}>{r.probability}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#4B5563", fontSize: "0.875rem", fontWeight: "500" }}>{r.confidence}%</td>
                    <td style={{ padding: "16px 24px", color: "#4B5563", fontSize: "0.875rem" }}>{r.doctor}</td>
                    <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "0.875rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={12} />
                        {r.date}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#2563EB",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}>
                        <FileText size={14} />
                        PDF
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem", color: "#6B7280" }}>
              <FileText size={48} style={{ margin: "0 auto 12px", color: "#D1D5DB" }} />
              <p style={{ fontWeight: "600", color: "#374151" }}>No reports found</p>
              <p style={{ fontSize: "0.875rem", marginTop: "4px" }}>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}