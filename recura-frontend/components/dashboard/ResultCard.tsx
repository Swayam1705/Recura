"use client";

import { motion } from "framer-motion";
import { Download, FileText, Stethoscope } from "lucide-react";
import {
  generateDoctorClinicalReport,
  generatePatientFriendlyReport,
  PredictionResult,
} from "@/lib/generateReport";

export default function ResultCard({
  result,
  patientInput,
}: {
  result: PredictionResult;
  patientInput?: any;
}) {
  const isHigh = result.riskLevel === "high";
  const isMed = result.riskLevel === "medium";
  const prob = (result.recurrenceProbability * 100).toFixed(1);
  const conf = (result.confidence * 100).toFixed(1);

  const theme = isHigh
    ? { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", badge: "#FEE2E2" }
    : isMed
    ? { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", badge: "#FEF3C7" }
    : { bg: "#F0FDF4", border: "#86EFAC", text: "#065F46", badge: "#D1FAE5" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", gap: "1rem" }}>
      <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: 16, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ background: theme.badge, color: theme.text, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                {result.riskLevel} risk
              </span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#64748B" }}>{result.patientId}</span>
            </div>
            <h2 style={{ margin: 0, color: theme.text, fontSize: "1.75rem" }}>{result.status}</h2>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              Probability <b>{prob}%</b> · Confidence <b>{conf}%</b>
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "start" }}>
            <button
              type="button"
              onClick={() => generatePatientFriendlyReport(result)}
              style={{ display: "inline-flex", gap: 8, alignItems: "center", border: "1px solid #CBD5E1", background: "white", color: "#0F172A", borderRadius: 10, padding: "0.75rem 1rem", fontWeight: 700, cursor: "pointer" }}
            >
              <FileText size={16} /> Patient Report (Layman)
            </button>
            <button
              type="button"
              onClick={() => generateDoctorClinicalReport(result, patientInput)}
              style={{ display: "inline-flex", gap: 8, alignItems: "center", border: "none", background: "linear-gradient(135deg,#0F766E,#0D9488)", color: "white", borderRadius: 10, padding: "0.75rem 1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)" }}
            >
              <Stethoscope size={16} /> Doctor Clinical Report
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "1.25rem" }}>
        <h3 style={{ marginTop: 0 }}>Key Clinical Parameters</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {(result.shapValues || []).map((s) => (
            <div key={s.feature} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "0.75rem 0.85rem", background: "#F8FAFC", borderRadius: 8, border: "1px solid #F1F5F9" }}>
              <div>
                <b>{s.feature}</b>
                <span style={{ color: "#64748B", marginLeft: 6 }}>({String(s.value)})</span>
              </div>
              <span style={{ fontWeight: 700, color: s.direction === "positive" ? "#DC2626" : "#059669" }}>
                {s.direction === "positive" ? "Elevates concern" : "Reassuring"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
