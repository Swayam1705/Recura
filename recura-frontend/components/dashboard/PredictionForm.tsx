"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";

const selectFields = [
  {
    name: "Response",
    label: "Treatment Response",
    options: [
      { value: "Excellent", label: "Excellent" },
      { value: "Indeterminate", label: "Indeterminate" },
      { value: "Biochemical Incomplete", label: "Biochemical Incomplete" },
      { value: "Structural Incomplete", label: "Structural Incomplete" },
    ],
  },
  {
    name: "Physical_Examination",
    label: "Physical Examination",
    options: [
      { value: "Normal", label: "Normal" },
      { value: "Single nodular goiter-left", label: "Single Nodular Goiter (Left)" },
      { value: "Single nodular goiter-right", label: "Single Nodular Goiter (Right)" },
      { value: "Multinodular goiter", label: "Multinodular Goiter" },
      { value: "Diffuse goiter", label: "Diffuse Goiter" },
    ],
  },
  {
    name: "T",
    label: "T Stage (Tumor Size)",
    options: [
      { value: "T1a", label: "T1a - Very small (<1cm)" },
      { value: "T1b", label: "T1b - Small (1-2cm)" },
      { value: "T2", label: "T2 - Medium (2-4cm)" },
      { value: "T3a", label: "T3a - Large (>4cm), no extension" },
      { value: "T3b", label: "T3b - Extends beyond thyroid capsule" },
      { value: "T4a", label: "T4a - Moderately advanced" },
      { value: "T4b", label: "T4b - Very advanced" },
    ],
  },
  {
    name: "N",
    label: "N Stage (Lymph Nodes)",
    options: [
      { value: "N0", label: "N0 - No nodes involved" },
      { value: "N1a", label: "N1a - Central compartment" },
      { value: "N1b", label: "N1b - Lateral neck" },
    ],
  },
  {
    name: "Risk",
    label: "ATA Risk Category",
    options: [
      { value: "Low", label: "Low Risk" },
      { value: "Intermediate", label: "Intermediate Risk" },
      { value: "High", label: "High Risk" },
    ],
  },
  {
    name: "Pathology",
    label: "Pathology Type",
    options: [
      { value: "Papillary", label: "Papillary" },
      { value: "Follicular", label: "Follicular" },
      { value: "Hurthel cell", label: "Hurthle Cell" },
      { value: "Micropapillary", label: "Micropapillary" },
    ],
  },
];

interface PredictionFormProps {
  onResult: (result: any) => void;
  prefillData?: any;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  backgroundColor: "white",
  border: "1.5px solid #E5E7EB",
  color: "#111827",
  fontSize: "0.9rem",
  transition: "all 0.2s",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "0.5rem",
};

export default function PredictionForm({ onResult, prefillData }: PredictionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    Age: prefillData?.Age || 45,
    Response: prefillData?.Response || "Excellent",
    Physical_Examination: prefillData?.Physical_Examination || "Normal",
    T: prefillData?.T || "T1a",
    N: prefillData?.N || "N0",
    Risk: prefillData?.Risk || "Low",
    Pathology: prefillData?.Pathology || "Papillary",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "Age" ? Number(value) : value,
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#3B82F6";
    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#E5E7EB";
    e.target.style.boxShadow = "none";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      onResult(result);
    } catch (err: any) {
      setError(`Cannot connect to backend. Make sure FastAPI is running at http://127.0.0.1:8000`);
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: "1rem",
        padding: "1.75rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        marginBottom: "1.5rem",
        paddingBottom: "1.25rem",
        borderBottom: "1px solid #F3F4F6",
      }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          backgroundColor: "#EFF6FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Brain size={22} color="#2563EB" />
        </div>
        <div>
          <h2 style={{
            fontFamily: "var(--font-space)",
            fontWeight: "700",
            color: "#111827",
            fontSize: "1.125rem",
          }}>
            Patient Clinical Data
          </h2>
          <p style={{ color: "#6B7280", fontSize: "0.8rem", marginTop: "2px" }}>
            Powered by trained Deep 1D-CNN model
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={labelStyle}>
            Patient Age <span style={{ color: "#9CA3AF", fontWeight: "400" }}>(years)</span>
          </label>
          <input
            type="number"
            name="Age"
            value={formData.Age}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min={1}
            max={100}
            required
            style={inputStyle}
          />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}>
          {selectFields.map((field) => (
            <div key={field.name}>
              <label style={labelStyle}>{field.label}</label>
              <select
                name={field.name}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            color: "#B91C1C",
            fontSize: "0.85rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            fontWeight: "500",
          }}>
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "12px",
            background: "linear-gradient(to right, #3B82F6, #1D4ED8)",
            fontWeight: "700",
            color: "white",
            fontSize: "0.95rem",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.35)",
            transition: "all 0.3s",
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing with Deep CNN...
            </>
          ) : (
            <>
              <Brain size={18} />
              Run AI Prediction
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}