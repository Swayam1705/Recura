"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import PredictionForm from "@/components/dashboard/PredictionForm";
import ResultCard from "@/components/dashboard/ResultCard";
import NoteParser from "@/components/dashboard/NoteParser";

export default function PredictPage() {
  const [result, setResult] = useState<any>(null);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [lastPatientInput, setLastPatientInput] = useState<any>(null);

  const handleResult = (data: any, patientInput?: any) => {
    setResult(data);
    if (patientInput) setLastPatientInput(patientInput);
  };

  const handleFeaturesExtracted = (features: Record<string, string | number>) => {
    // Trigger prefill in PredictionForm via key-change or state update
    setPrefillData({ ...features, _timestamp: Date.now() });
    // Scroll to form
    setTimeout(() => {
      const formEl = document.getElementById("prediction-form-section");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h1 style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: "700",
            color: "#111827",
            letterSpacing: "-0.02em",
          }}>
            New Prediction
          </h1>
          <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
            Enter patient clinical data or paste notes for AI-powered analysis.
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.625rem 1rem",
          background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)",
          border: "1px solid #A7F3D0",
          borderRadius: "9999px",
        }}>
          <div style={{ position: "relative", display: "flex" }}>
            <span style={{
              position: "absolute",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#10B981",
              opacity: 0.75,
              animation: "ping 1.5s infinite",
            }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#059669" }} />
          </div>
          <span style={{ color: "#065F46", fontSize: "0.8rem", fontWeight: "700" }}>
            Deep CNN Model Active
          </span>
        </div>
      </motion.div>

      {/* AI Note Parser at the top */}
      <NoteParser onFeaturesExtracted={handleFeaturesExtracted} />

      {/* Grid: Form on left, Result on right */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1.5rem",
      }} className="predict-grid">
        <div id="prediction-form-section" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <PredictionForm onResult={handleResult} prefillData={prefillData} />
        </div>

        <div>
          {result ? (
            <ResultCard result={result} patientInput={lastPatientInput} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                height: "100%",
                minHeight: "500px",
                backgroundColor: "white",
                border: "2px dashed #E5E7EB",
                borderRadius: "1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                textAlign: "center",
                padding: "3rem 2rem",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Brain size={40} color="#2563EB" strokeWidth={1.5} />
              </motion.div>
              <div>
                <h3 style={{
                  color: "#111827",
                  fontWeight: "700",
                  fontFamily: "var(--font-space)",
                  fontSize: "1.375rem",
                  marginBottom: "0.5rem",
                }}>
                  Ready for AI Analysis
                </h3>
                <p style={{
                  color: "#6B7280",
                  fontSize: "0.9rem",
                  maxWidth: "380px",
                  lineHeight: "1.6",
                }}>
                  Paste clinical notes above OR fill the form manually, then click <strong>Run AI Prediction</strong>.
                </p>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #F3F4F6",
                width: "100%",
                maxWidth: "360px",
                marginTop: "0.5rem",
                justifyContent: "space-around",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-space)",
                    fontWeight: "700",
                    color: "#111827",
                    fontSize: "1.25rem",
                  }}>
                    98.7%
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "0.7rem", marginTop: "2px" }}>CNN Accuracy</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-space)",
                    fontWeight: "700",
                    color: "#111827",
                    fontSize: "1.25rem",
                  }}>
                    &lt;2s
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "0.7rem", marginTop: "2px" }}>Response Time</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-space)",
                    fontWeight: "700",
                    color: "#111827",
                    fontSize: "1.25rem",
                  }}>
                    XAI
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "0.7rem", marginTop: "2px" }}>Explainable</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @media (min-width: 1280px) {
          .predict-grid {
            grid-template-columns: 1.1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}