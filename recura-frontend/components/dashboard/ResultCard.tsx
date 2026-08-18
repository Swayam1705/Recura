"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Download, Sparkles, Loader2, FileCheck, FileText } from "lucide-react";
import { generateClinicalReport, PatientInput } from "@/lib/generateReport";

const riskConfig = {
  low: {
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    lightBg: "#D1FAE5",
    bar: "#10B981",
    icon: CheckCircle,
    label: "Low Risk",
    description: "Low probability of recurrence detected",
  },
  medium: {
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FCD34D",
    lightBg: "#FDE68A",
    bar: "#F59E0B",
    icon: AlertCircle,
    label: "Medium Risk",
    description: "Moderate probability of recurrence detected",
  },
  high: {
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    lightBg: "#FEE2E2",
    bar: "#EF4444",
    icon: AlertTriangle,
    label: "High Risk",
    description: "High probability of recurrence detected",
  },
};

interface ResultCardProps {
  result: any;
  patientInput?: PatientInput;
  onExportPDF?: () => void;
}

export default function ResultCard({ result, patientInput, onExportPDF }: ResultCardProps) {
  const [exportState, setExportState] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [exportMode, setExportMode] = useState<"clinical" | "technical">("clinical");

  const config = riskConfig[result.riskLevel as keyof typeof riskConfig];
  const Icon = config.icon;
  const probability = Math.round(result.recurrenceProbability * 100);

  const handleExport = async (includeTechnical: boolean = false) => {
    if (!patientInput) {
      alert("Patient data not available. Please run a new prediction.");
      return;
    }
    setExportMode(includeTechnical ? "technical" : "clinical");
    setExportState("generating");
    try {
      await generateClinicalReport(patientInput, result, "shap-chart", includeTechnical);
      setExportState("success");
      setTimeout(() => setExportState("idle"), 3000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setExportState("error");
      setTimeout(() => setExportState("idle"), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{
        padding: "1.75rem",
        borderRadius: "1rem",
        border: `2px solid ${config.border}`,
        backgroundColor: config.bg,
        boxShadow: `0 4px 20px ${config.bar}20`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: config.lightBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={24} color={config.color} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{
                fontFamily: "var(--font-space)",
                fontWeight: "700",
                fontSize: "1.25rem",
                color: config.color,
              }}>
                {config.label}
              </h3>
              <p style={{ color: "#6B7280", fontSize: "0.875rem", marginTop: "2px" }}>
                {config.description}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "var(--font-space)",
              fontSize: "2.5rem",
              fontWeight: "700",
              color: config.color,
              lineHeight: "1",
              letterSpacing: "-0.02em",
            }}>
              {probability}%
            </div>
            <p style={{ color: "#6B7280", fontSize: "0.75rem", marginTop: "0.375rem", fontWeight: "500" }}>
              Confidence: {Math.round(result.confidence * 100)}%
            </p>
          </div>
        </div>

        <div style={{
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          borderRadius: "9999px",
          height: "10px",
          overflow: "hidden",
          marginBottom: "1rem",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${probability}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              borderRadius: "9999px",
              backgroundColor: config.bar,
            }}
          />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "0.75rem",
            border: "1px solid #F3F4F6",
          }}>
            <p style={{ color: "#6B7280", fontSize: "0.7rem", fontWeight: "500", marginBottom: "4px" }}>Patient ID</p>
            <p style={{ color: "#111827", fontWeight: "600", fontSize: "0.875rem" }}>{result.patientId}</p>
          </div>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "0.75rem",
            border: "1px solid #F3F4F6",
          }}>
            <p style={{ color: "#6B7280", fontSize: "0.7rem", fontWeight: "500", marginBottom: "4px" }}>Model Version</p>
            <p style={{ color: "#111827", fontWeight: "600", fontSize: "0.875rem" }}>{result.modelVersion}</p>
          </div>
        </div>
      </div>

      <div
        id="shap-chart"
        style={{
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: "#EFF6FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <TrendingUp size={16} color="#2563EB" />
          </div>
          <div>
            <h3 style={{
              fontFamily: "var(--font-space)",
              fontWeight: "700",
              color: "#111827",
              fontSize: "1rem",
            }}>
              SHAP Feature Importance
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.7rem" }}>Which features drove this prediction</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {result.shapValues.map((shap: any, index: number) => (
            <motion.div
              key={shap.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
                <span style={{ color: "#374151", fontWeight: "500" }}>{shap.feature}</span>
                <span style={{
                  fontWeight: "700",
                  color: shap.direction === "positive" ? "#DC2626" : "#059669",
                }}>
                  {shap.direction === "positive" ? "+" : "-"}
                  {shap.impact.toFixed(3)}
                </span>
              </div>
              <div style={{
                width: "100%",
                backgroundColor: "#F3F4F6",
                borderRadius: "9999px",
                height: "8px",
                overflow: "hidden",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(shap.impact) * 200}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08 }}
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    background: shap.direction === "positive"
                      ? "linear-gradient(to right, #F87171, #EF4444)"
                      : "linear-gradient(to right, #34D399, #10B981)",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{
        background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
        border: "1px solid #DBEAFE",
        borderRadius: "1rem",
        padding: "1.25rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
      }}>
        <Sparkles size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{
            fontWeight: "700",
            color: "#1E3A8A",
            fontSize: "0.875rem",
            marginBottom: "4px",
          }}>
            AI Recommendation
          </h4>
          <p style={{ color: "#1E40AF", fontSize: "0.875rem", lineHeight: "1.5" }}>
            {result.riskLevel === "high"
              ? "Consider intensive follow-up with TSH monitoring every 3 months. Recommend imaging within 6 months."
              : result.riskLevel === "medium"
              ? "Standard follow-up protocol with TSH monitoring every 6 months is advised."
              : "Routine annual follow-up appears sufficient. Continue standard monitoring."}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          EXPORT SECTION — Two-button layout
          ═══════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: "1rem",
        padding: "1.25rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <FileText size={16} color="#0F766E" />
          <h4 style={{
            fontFamily: "var(--font-space)",
            fontWeight: "700",
            color: "#111827",
            fontSize: "0.95rem",
          }}>
            Export Report
          </h4>
        </div>

        {/* PRIMARY: Clinical Report */}
        <button
          onClick={() => handleExport(false)}
          disabled={exportState === "generating"}
          style={{
            width: "100%",
            padding: "0.875rem",
            borderRadius: "12px",
            border: "none",
            color: "white",
            background:
              exportState === "success" && exportMode === "clinical"
                ? "linear-gradient(135deg, #10B981, #059669)"
                : exportState === "error" && exportMode === "clinical"
                ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : "linear-gradient(135deg, #0F766E, #0D9488)",
            fontWeight: "600",
            fontSize: "0.875rem",
            cursor: exportState === "generating" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: "0 10px 25px rgba(15, 118, 110, 0.25)",
            opacity: exportState === "generating" ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (exportState === "idle") e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {exportState === "generating" && exportMode === "clinical" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Clinical Report...
            </>
          ) : exportState === "success" && exportMode === "clinical" ? (
            <>
              <FileCheck size={16} />
              Clinical Report Downloaded!
            </>
          ) : exportState === "error" && exportMode === "clinical" ? (
            <>
              <Download size={16} />
              Export Failed - Click to Retry
            </>
          ) : (
            <>
              <Download size={16} />
              Export Clinical Report (PDF)
            </>
          )}
        </button>

        {/* SECONDARY: Full Report with Technical Appendix */}
        <button
          onClick={() => handleExport(true)}
          disabled={exportState === "generating"}
          style={{
            width: "100%",
            padding: "0.625rem",
            borderRadius: "10px",
            border: "1.5px solid #E5E7EB",
            color:
              exportState === "success" && exportMode === "technical"
                ? "#059669"
                : exportState === "error" && exportMode === "technical"
                ? "#DC2626"
                : "#6B7280",
            backgroundColor: "white",
            fontWeight: "500",
            fontSize: "0.75rem",
            cursor: exportState === "generating" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (exportState !== "generating") {
              e.currentTarget.style.borderColor = "#0F766E";
              e.currentTarget.style.color = "#0F766E";
            }
          }}
          onMouseLeave={(e) => {
            if (exportState === "idle") {
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.color = "#6B7280";
            }
          }}
        >
          {exportState === "generating" && exportMode === "technical" ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Generating Full Report...
            </>
          ) : exportState === "success" && exportMode === "technical" ? (
            <>
              <FileCheck size={12} />
              Full Report Downloaded!
            </>
          ) : (
            <>
              <Download size={12} />
              Export with Technical Appendix (for audit/research)
            </>
          )}
        </button>

        <p style={{
          color: "#9CA3AF",
          fontSize: "0.7rem",
          textAlign: "center",
          marginTop: "0.25rem",
          fontStyle: "italic",
        }}>
          Clinical report: doctor-friendly summary. Technical appendix adds SHAP scores & model metadata.
        </p>
      </div>
    </motion.div>
  );
}