"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  X,
  Play,
  CheckCircle,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface UploadState {
  file: File | null;
  preview: any[];
  status: "idle" | "parsing" | "uploading" | "complete" | "error";
  results: any[];
  error: string | null;
}

const riskColors = {
  low: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", bar: "#10B981" },
  medium: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D", bar: "#F59E0B" },
  high: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", bar: "#EF4444" },
};

export default function BatchPage() {
  const [state, setState] = useState<UploadState>({
    file: null,
    preview: [],
    status: "idle",
    results: [],
    error: null,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setState((prev) => ({ ...prev, file, status: "parsing", error: null }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1, 6).map((line) => {
        const values = line.split(",");
        return headers.reduce((obj: any, header, i) => {
          obj[header] = values[i]?.trim();
          return obj;
        }, {});
      });
      setState((prev) => ({ ...prev, preview: rows, status: "idle" }));
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleBatchPredict = async () => {
    if (!state.file) return;
    setState((prev) => ({ ...prev, status: "uploading", error: null }));

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      const response = await fetch("http://127.0.0.1:8000/predict/batch", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Batch prediction failed");
      }

      const results = await response.json();
      setState((prev) => ({ ...prev, results, status: "complete" }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error.message || "Failed to process batch",
      }));
    }
  };

  const downloadSample = () => {
    const csv = `Age,Response,Physical_Examination,T,N,Risk,Pathology
27,Indeterminate,Single nodular goiter-left,T1a,N0,Low,Micropapillary
34,Excellent,Multinodular goiter,T1a,N0,Low,Micropapillary
62,Structural Incomplete,Multinodular goiter,T4a,N1b,High,Hurthel cell
45,Excellent,Normal,T1b,N0,Low,Papillary
70,Structural Incomplete,Diffuse goiter,T4b,N1b,High,Hurthel cell
38,Excellent,Single nodular goiter-right,T1a,N0,Low,Micropapillary
55,Biochemical Incomplete,Multinodular goiter,T3a,N1a,Intermediate,Follicular
41,Indeterminate,Single nodular goiter-left,T2,N0,Intermediate,Papillary
65,Structural Incomplete,Multinodular goiter,T3b,N1b,High,Follicular
30,Excellent,Normal,T1a,N0,Low,Papillary`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recura_sample_batch.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{
          fontFamily: "var(--font-space)",
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          fontWeight: "700",
          color: "#111827",
          letterSpacing: "-0.02em",
        }}>
          Batch Prediction
        </h1>
        <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
          Upload CSV data for bulk thyroid cancer recurrence predictions using Deep 1D-CNN.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
          border: "1px solid #DBEAFE",
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <p style={{
            color: "#1E40AF",
            fontSize: "0.875rem",
            fontWeight: "700",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <FileSpreadsheet size={16} />
            Required CSV Columns (case-sensitive)
          </p>
          <code style={{
            color: "#1D4ED8",
            fontSize: "0.8rem",
            fontFamily: "monospace",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            padding: "0.5rem 0.875rem",
            borderRadius: "6px",
            display: "inline-block",
          }}>
            Age, Response, Physical_Examination, T, N, Risk, Pathology
          </code>
        </div>
        <button
          onClick={downloadSample}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            backgroundColor: "white",
            border: "1px solid #DBEAFE",
            borderRadius: "10px",
            color: "#2563EB",
            fontWeight: "600",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#EFF6FF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
        >
          <Download size={14} />
          Download Sample
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#3B82F6" : state.file ? "#10B981" : "#D1D5DB"}`,
          borderRadius: "1rem",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "#EFF6FF" : state.file ? "#ECFDF5" : "white",
          transition: "all 0.3s",
        }}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {state.file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
            >
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#D1FAE5",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <FileSpreadsheet size={28} color="#059669" />
              </div>
              <div>
                <p style={{ color: "#111827", fontWeight: "600", fontSize: "1rem" }}>{state.file.name}</p>
                <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                  {(state.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setState({ file: null, preview: [], status: "idle", results: [], error: null });
                }}
                style={{
                  color: "#DC2626",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
                Remove file
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
            >
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#EFF6FF",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Upload size={28} color="#2563EB" />
              </div>
              <div>
                <p style={{ color: "#111827", fontWeight: "600", fontSize: "1rem" }}>
                  {isDragActive ? "Drop CSV file here" : "Drop CSV file here or click to browse"}
                </p>
                <p style={{ color: "#6B7280", fontSize: "0.875rem", marginTop: "4px" }}>
                  CSV files up to 10MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {state.error && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem 1.25rem",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "12px",
          color: "#B91C1C",
        }}>
          <AlertCircle size={18} />
          <div>
            <div style={{ fontWeight: "700" }}>Error</div>
            <div style={{ fontSize: "0.875rem" }}>{state.error}</div>
          </div>
        </div>
      )}

      {state.preview.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F3F4F6" }}>
            <h3 style={{ color: "#111827", fontWeight: "600", fontSize: "0.95rem" }}>Data Preview</h3>
            <p style={{ color: "#6B7280", fontSize: "0.75rem", marginTop: "2px" }}>First 5 rows of your file</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  {Object.keys(state.preview[0]).map((col) => (
                    <th key={col} style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#6B7280",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} style={{ padding: "12px 16px", color: "#374151" }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {state.file && state.status !== "complete" && (
        <button
          onClick={handleBatchPredict}
          disabled={state.status === "uploading"}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "12px",
            background: "linear-gradient(to right, #3B82F6, #1D4ED8)",
            fontWeight: "700",
            color: "white",
            fontSize: "1rem",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.35)",
            transition: "all 0.3s",
            opacity: state.status === "uploading" ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (state.status !== "uploading") e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {state.status === "uploading" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing with Deep CNN...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Batch Prediction
            </>
          )}
        </button>
      )}

      {state.status === "complete" && state.results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #F3F4F6",
            backgroundColor: "#ECFDF5",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle size={20} color="#059669" />
              <div>
                <h3 style={{ color: "#111827", fontWeight: "600" }}>
                  {state.results.length} Predictions Complete
                </h3>
                <p style={{ color: "#059669", fontSize: "0.75rem" }}>Deep 1D-CNN processed all patient data</p>
              </div>
            </div>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.5rem 1rem",
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#374151",
              cursor: "pointer",
            }}>
              <Download size={14} />
              Export CSV
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  {["Patient", "Risk Level", "Probability", "Confidence"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 24px",
                      textAlign: "left",
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
                {state.results.map((r: any, i: number) => {
                  const rc = riskColors[r.riskLevel as keyof typeof riskColors];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 24px", color: "#111827", fontWeight: "600" }}>{r.id}</td>
                      <td style={{ padding: "12px 24px" }}>
                        <span style={{
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
                      <td style={{ padding: "12px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "80px", backgroundColor: "#F3F4F6", borderRadius: "9999px", height: "8px", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "9999px", backgroundColor: rc.bar, width: `${r.probability}%` }} />
                          </div>
                          <span style={{ color: "#111827", fontWeight: "600", minWidth: "3ch" }}>{r.probability}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 24px", color: "#374151", fontWeight: "500" }}>{r.confidence}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
