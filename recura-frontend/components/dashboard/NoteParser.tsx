"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, CheckCircle, AlertCircle, Copy,
  RotateCcw, ChevronDown, ChevronUp, Wand2, FileText
} from "lucide-react";

interface ExtractedData {
  extracted_features: Record<string, string | number>;
  confidence_scores: Record<string, number>;
  source_texts: Record<string, string>;
  model_used: string;
  field_count: number;
}

interface NoteParserProps {
  onFeaturesExtracted: (features: Record<string, string | number>) => void;
}

const SAMPLE_NOTES = [
  {
    label: "High-Risk Case",
    text: `Patient is 62 y/o female with papillary thyroid carcinoma. 
Tumor T3b with gross extrathyroidal extension into strap muscles. 
N1a positive central compartment nodes (3/8). Physical exam shows 
multinodular goiter. Post-operative response is structurally incomplete 
with rising thyroglobulin. ATA high risk category. Recommend RAI therapy.`
  },
  {
    label: "Low-Risk Case",
    text: `45 y/o male with micropapillary carcinoma. T1a tumor (0.6cm), 
completely intrathyroidal. N0 - no nodal involvement. Normal physical exam.
Excellent response to initial therapy - undetectable thyroglobulin. 
ATA low risk. Routine surveillance recommended.`
  },
  {
    label: "Intermediate Case",
    text: `Female patient, 51 years old, follicular thyroid carcinoma. 
T2 tumor confined to thyroid. N1b lateral neck nodes involved. 
Single left thyroid nodule on exam. Biochemically incomplete response 
with detectable Tg but no structural disease on imaging. 
ATA intermediate risk stratification.`
  },
];

export default function NoteParser({ onFeaturesExtracted }: NoteParserProps) {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [useLLM, setUseLLM] = useState(true);

  const parseNotes = async () => {
    const trimmed = notes.trim();

    // Frontend validation - catch problems BEFORE hitting API
    if (!trimmed) {
      setError("Please paste some clinical notes first");
      return;
    }
    if (trimmed.length < 15) {
      setError(`Notes too short (${trimmed.length}/15 characters minimum). Please add more clinical details.`);
      return;
    }
    if (trimmed.split(/\s+/).length < 3) {
      setError("Please provide a complete clinical note with multiple words.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/parse-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trimmed, use_llm: useLLM }),
      });

      // Handle non-OK responses gracefully (no throw)
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Server error" }));
        setError(err.detail || `Server error (${response.status})`);
        return;
      }

      const data: ExtractedData = await response.json();
      if (data.field_count === 0) {
        setError("Could not extract any clinical features. Try adding more medical details like age, tumor stage, or pathology.");
      } else {
        setResult(data);
      }
    } catch (err) {
      // Network errors only (backend down, etc.)
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Cannot connect to backend. Make sure FastAPI is running on port 8000.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyToForm = () => {
    if (result) {
      onFeaturesExtracted(result.extracted_features);
      const btn = document.getElementById("apply-btn");
      if (btn) {
        btn.textContent = "✓ Applied to Form!";
        setTimeout(() => {
          if (btn) btn.textContent = "Apply to Prediction Form →";
        }, 2000);
      }
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.85) return { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" };
    if (conf >= 0.70) return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
    return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.85) return "High";
    if (conf >= 0.70) return "Medium";
    return "Low";
  };

  return (
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
      {/* Header with gradient */}
      <div style={{
        background: "linear-gradient(135deg, #0F766E, #06B6D4)",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Wand2 size={22} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{
            color: "white",
            fontFamily: "var(--font-space)",
            fontWeight: "700",
            fontSize: "1.05rem",
          }}>
            AI Clinical Note Parser
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.75rem", marginTop: "2px" }}>
            Paste doctor notes → auto-fill form with extracted features
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem 0.75rem",
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: "9999px",
          fontSize: "0.7rem",
          color: "white",
          fontWeight: "600",
        }}>
          <Sparkles size={11} />
          POWERED BY AI
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.5rem" }}>
        {/* Sample buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: "600" }}>
            TRY SAMPLE:
          </span>
          {SAMPLE_NOTES.map((sample) => (
            <button
              key={sample.label}
              onClick={() => { setNotes(sample.text); setResult(null); setError(""); }}
              style={{
                fontSize: "0.7rem",
                padding: "0.25rem 0.625rem",
                borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: "white",
                color: "#0F766E",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F0FDFA";
                e.currentTarget.style.borderColor = "#0F766E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <Copy size={10} />
              {sample.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div style={{ position: "relative", marginBottom: "0.5rem" }}>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); if (error) setError(""); }}
            placeholder="Paste clinical notes here...

Example: '58 y/o female with papillary thyroid carcinoma, T3b tumor with extrathyroidal extension, N1a positive nodes, multinodular goiter, structurally incomplete response, ATA high risk...'"
            rows={6}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              borderRadius: "10px",
              border: `1.5px solid ${error ? "#FECACA" : "#E5E7EB"}`,
              fontSize: "0.85rem",
              fontFamily: "'Courier New', monospace",
              resize: "vertical",
              outline: "none",
              color: "#111827",
              lineHeight: "1.5",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = error ? "#EF4444" : "#0F766E"}
            onBlur={(e) => e.target.style.borderColor = error ? "#FECACA" : "#E5E7EB"}
          />
          {notes && (
            <button
              onClick={() => { setNotes(""); setResult(null); setError(""); }}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                padding: "0.375rem",
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                cursor: "pointer",
                color: "#6B7280",
              }}
              title="Clear notes"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>

        {/* Character counter */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          fontSize: "0.7rem",
        }}>
          <span style={{
            color: notes.trim().length < 15 && notes.trim().length > 0 ? "#DC2626" : "#9CA3AF",
            fontWeight: notes.trim().length < 15 && notes.trim().length > 0 ? "600" : "400",
          }}>
            {notes.trim().length}/15 characters minimum
          </span>
          {notes.trim().length >= 15 && (
            <span style={{ color: "#059669", fontWeight: "600" }}>
              ✓ Ready to extract
            </span>
          )}
        </div>

        {/* LLM toggle */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.75rem",
          color: "#6B7280",
          marginBottom: "0.875rem",
          cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={useLLM}
            onChange={(e) => setUseLLM(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          Use AI extraction (GPT) — falls back to rule-based if unavailable
        </label>

        {/* Parse button */}
        <button
          onClick={parseNotes}
          disabled={loading || !notes.trim()}
          style={{
            width: "100%",
            padding: "0.875rem",
            borderRadius: "10px",
            border: "none",
            background: loading || !notes.trim()
              ? "#D1D5DB"
              : "linear-gradient(135deg, #0F766E, #06B6D4)",
            color: "white",
            fontWeight: "600",
            fontSize: "0.9rem",
            cursor: loading || !notes.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: loading || !notes.trim() ? "none" : "0 10px 25px rgba(15, 118, 110, 0.25)",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing notes with AI...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Extract Clinical Features
            </>
          )}
        </button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: "0.875rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ color: "#991B1B", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: "1rem" }}
            >
              <div style={{
                padding: "1rem",
                backgroundColor: "#F0FDFA",
                border: "1px solid #A7F3D0",
                borderRadius: "10px",
                marginBottom: "0.75rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle size={16} color="#059669" />
                    <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#065F46" }}>
                      Extracted {result.field_count} clinical feature{result.field_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "0.65rem",
                    padding: "0.2rem 0.5rem",
                    background: "white",
                    color: "#0F766E",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontFamily: "monospace",
                    border: "1px solid #A7F3D0",
                  }}>
                    {result.model_used}
                  </span>
                </div>

                {/* Feature grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.5rem",
                }}>
                  {Object.entries(result.extracted_features).map(([field, value]) => {
                    const conf = result.confidence_scores[field] ?? 0.75;
                    const color = getConfidenceColor(conf);
                    const source = result.source_texts[field];
                    return (
                      <div key={field} style={{
                        padding: "0.625rem 0.75rem",
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
                          <span style={{ fontSize: "0.65rem", color: "#6B7280", fontWeight: "600", textTransform: "uppercase" }}>
                            {field.replace(/_/g, " ")}
                          </span>
                          <span style={{
                            fontSize: "0.6rem",
                            padding: "1px 6px",
                            borderRadius: "9999px",
                            background: color.bg,
                            color: color.text,
                            border: `1px solid ${color.border}`,
                            fontWeight: "700",
                          }}>
                            {getConfidenceLabel(conf)}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "#111827", margin: 0 }}>
                          {String(value)}
                        </p>
                        {source && (
                          <p style={{
                            fontSize: "0.65rem",
                            color: "#9CA3AF",
                            fontStyle: "italic",
                            marginTop: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            "{source}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Raw JSON toggle */}
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.7rem",
                    color: "#6B7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showRaw ? "Hide" : "Show"} raw extraction data
                </button>

                <AnimatePresence>
                  {showRaw && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        fontSize: "0.7rem",
                        backgroundColor: "#111827",
                        color: "#10B981",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        overflow: "auto",
                        marginTop: "0.5rem",
                        maxHeight: "200px",
                      }}
                    >
                      {JSON.stringify(result.extracted_features, null, 2)}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>

              {/* Apply button */}
              <button
                id="apply-btn"
                onClick={applyToForm}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.25)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <FileText size={16} />
                Apply to Prediction Form →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}