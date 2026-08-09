"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Activity,
  Target,
  TrendingUp,
  Brain,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Analytics {
  target_distribution?: string;
  feature_importance?: string;
  training_curves?: string;
  confusion_matrices?: string;
  roc_curve?: string;
  shap_summary?: string;
  lime_patient?: string;
}

interface MetricRow {
  [key: string]: number;
}

const analyticsCards = [
  {
    key: "target_distribution",
    title: "Dataset Distribution",
    subtitle: "Normal vs Recurrence patient distribution",
    icon: Target,
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    key: "feature_importance",
    title: "Feature Importance",
    subtitle: "Top 7 clinical indicators used by the model",
    icon: BarChart3,
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    key: "training_curves",
    title: "CNN Training Curves",
    subtitle: "Model accuracy and loss over epochs",
    icon: TrendingUp,
    color: "#10B981",
    bg: "#ECFDF5",
  },
  {
    key: "confusion_matrices",
    title: "Confusion Matrices",
    subtitle: "Model diagnostic performance across classifiers",
    icon: Activity,
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    key: "roc_curve",
    title: "ROC Curve (Deep CNN)",
    subtitle: "Receiver Operating Characteristics analysis",
    icon: Activity,
    color: "#EC4899",
    bg: "#FCE7F3",
  },
  {
    key: "shap_summary",
    title: "SHAP Global Explainability",
    subtitle: "Feature-level impact across all predictions",
    icon: Sparkles,
    color: "#06B6D4",
    bg: "#ECFEFF",
  },
  {
    key: "lime_patient",
    title: "LIME Local Explainability",
    subtitle: "Individual patient prediction breakdown",
    icon: Brain,
    color: "#F97316",
    bg: "#FFF7ED",
  },
];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [metrics, setMetrics] = useState<Record<string, MetricRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [analyticsRes, metricsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/analytics/list"),
          fetch("http://127.0.0.1:8000/analytics/metrics"),
        ]);

        if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");

        const analyticsData = await analyticsRes.json();
        const metricsData = await metricsRes.json();

        setAnalytics(analyticsData);
        setMetrics(metricsData);
      } catch (err: any) {
        setError("Cannot connect to FastAPI backend. Ensure it is running at http://127.0.0.1:8000");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{
          fontFamily: "var(--font-space)",
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          fontWeight: "700",
          color: "#111827",
          letterSpacing: "-0.02em",
        }}>
          Model Analytics & XAI
        </h1>
        <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
          Deep insights into your federated Deep CNN model — accuracy, explanations, and diagnostics.
        </p>
      </motion.div>

      {loading && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem",
          backgroundColor: "white",
          borderRadius: "1rem",
          border: "1px solid #E5E7EB",
          gap: "0.75rem",
        }}>
          <Loader2 size={20} className="animate-spin" color="#2563EB" />
          <span style={{ color: "#4B5563", fontWeight: "500" }}>Loading model analytics...</span>
        </div>
      )}

      {error && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1.25rem 1.5rem",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "1rem",
          color: "#B91C1C",
        }}>
          <AlertCircle size={20} />
          <div>
            <div style={{ fontWeight: "700", marginBottom: "2px" }}>Backend Connection Error</div>
            <div style={{ fontSize: "0.875rem" }}>{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && Object.keys(metrics).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "1rem",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{
              fontFamily: "var(--font-space)",
              fontWeight: "700",
              color: "#111827",
              fontSize: "1.125rem",
            }}>
              Model Comparison Metrics
            </h2>
            <p style={{ color: "#6B7280", fontSize: "0.85rem", marginTop: "2px" }}>
              Performance across all trained classifiers
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    Model
                  </th>
                  {Object.keys(Object.values(metrics)[0] || {}).map((metric) => (
                    <th key={metric} style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {metric}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([modelName, values]) => (
                  <tr key={modelName} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "600" }}>
                      {modelName}
                    </td>
                    {Object.values(values).map((val: any, i) => (
                      <td key={i} style={{ padding: "12px 16px", color: "#4B5563" }}>
                        {typeof val === "number" ? val.toFixed(4) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {!loading && !error && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: "1.25rem",
        }}>
          {analyticsCards.map((card, i) => {
            const imageUrl = analytics[card.key as keyof Analytics];

            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.3s",
                  cursor: imageUrl ? "pointer" : "default",
                }}
                whileHover={imageUrl ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" } : {}}
                onClick={() => imageUrl && setSelectedImage({ url: imageUrl, title: card.title })}
              >
                <div style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <card.icon size={20} color={card.color} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: "var(--font-space)",
                      fontWeight: "700",
                      color: "#111827",
                      fontSize: "0.95rem",
                    }}>
                      {card.title}
                    </h3>
                    <p style={{ color: "#6B7280", fontSize: "0.75rem", marginTop: "2px" }}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: "1rem",
                  minHeight: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FAFAFA",
                }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={card.title}
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "contain",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <div style={{
                      textAlign: "center",
                      color: "#9CA3AF",
                      padding: "2rem",
                    }}>
                      <AlertCircle size={32} style={{ margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                        Image not generated yet
                      </p>
                      <p style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                        Run: python thyroid_pipeline.py
                      </p>
                    </div>
                  )}
                </div>

                {imageUrl && (
                  <div style={{
                    padding: "0.75rem 1.5rem",
                    borderTop: "1px solid #F3F4F6",
                    fontSize: "0.75rem",
                    color: "#2563EB",
                    fontWeight: "600",
                    textAlign: "right",
                  }}>
                    Click to expand →
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            cursor: "pointer",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              backgroundColor: "white",
              borderRadius: "1rem",
              overflow: "hidden",
              padding: "1.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}>
              <h3 style={{
                fontFamily: "var(--font-space)",
                fontWeight: "700",
                color: "#111827",
                fontSize: "1.125rem",
              }}>
                {selectedImage.title}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "#F3F4F6",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                ✕ Close
              </button>
            </div>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}