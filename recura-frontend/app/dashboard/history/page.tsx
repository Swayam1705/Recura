"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search, Filter, ChevronLeft, ChevronRight, TrendingUp, Users,
  AlertTriangle, BarChart3, Calendar, Eye, Download, Activity,
  Loader2, Database
} from "lucide-react";

interface Prediction {
  id: number;
  patient_id: string;
  age: number;
  pathology: string;
  t_stage: string;
  n_stage: string;
  risk_category: string;
  recurrence_probability: number;
  confidence: number;
  risk_level: string;
  model_version: string;
  created_at: string;
}

interface Stats {
  total_predictions: number;
  unique_patients: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  avg_risk_score: number;
  recent_7_days: number;
}

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  low: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0", dot: "#10B981" },
  medium: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", dot: "#F59E0B" },
  high: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA", dot: "#EF4444" },
};

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "20",
        ...(search && { search }),
        ...(riskFilter && { risk: riskFilter }),
      });
      const res = await fetch(`http://127.0.0.1:8000/history?${params}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, [search, riskFilter, page]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/history/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [fetchPredictions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportCSV = () => {
    window.open("http://127.0.0.1:8000/history/export/csv", "_blank");
  };

  const statCards = stats ? [
    { label: "Total Predictions", value: stats.total_predictions, icon: Database, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Unique Patients", value: stats.unique_patients, icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "High Risk", value: stats.high_risk, icon: AlertTriangle, color: "#EF4444", bg: "#FEE2E2" },
    { label: "Medium Risk", value: stats.medium_risk, icon: TrendingUp, color: "#F59E0B", bg: "#FEF3C7" },
    { label: "Low Risk", value: stats.low_risk, icon: BarChart3, color: "#10B981", bg: "#D1FAE5" },
    { label: "Avg Risk Score", value: `${(stats.avg_risk_score * 100).toFixed(1)}%`, icon: Activity, color: "#0F766E", bg: "#F0FDFA" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h1 style={{
            fontFamily: "var(--font-space)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
          }}>
            Patient History
          </h1>
          <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
            All predictions saved automatically. Search, filter, and track patient outcomes.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1rem",
            background: "linear-gradient(135deg, #0F766E, #0D9488)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            boxShadow: "0 10px 25px rgba(15, 118, 110, 0.25)",
          }}
        >
          <Download size={16} />
          Export All (CSV)
        </button>
      </motion.div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem",
      }}>
        {statsLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} style={{
              background: "white",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              height: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Loader2 size={16} className="animate-spin" color="#9CA3AF" />
            </div>
          ))
        ) : (
          statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: "white",
                  padding: "1.125rem",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.625rem",
                }}>
                  <Icon size={18} color={card.color} />
                </div>
                <p style={{
                  fontFamily: "var(--font-space)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1,
                }}>
                  {card.value}
                </p>
                <p style={{ fontSize: "0.7rem", color: "#6B7280", marginTop: "0.375rem", fontWeight: 500 }}>
                  {card.label}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <Search size={16} style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search patient ID or pathology..."
            style={{
              width: "100%",
              padding: "0.7rem 1rem 0.7rem 2.5rem",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              fontSize: "0.875rem",
              outline: "none",
              color: "#111827",
              background: "white",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#0F766E"; e.target.style.boxShadow = "0 0 0 4px rgba(15,118,110,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        <div style={{ position: "relative", flex: "0 0 200px" }}>
          <Filter size={16} style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
            pointerEvents: "none",
          }} />
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              padding: "0.7rem 1rem 0.7rem 2.5rem",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              fontSize: "0.875rem",
              outline: "none",
              color: "#111827",
              background: "white",
              cursor: "pointer",
              appearance: "none",
            }}
          >
            <option value="">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                {["Patient ID", "Age", "Pathology", "T/N Stage", "Risk", "Score", "Date", ""].map((h) => (
                  <th key={h} style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
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
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} style={{ padding: "1rem", borderBottom: "1px solid #F3F4F6" }}>
                        <div style={{
                          height: "16px",
                          background: "#F3F4F6",
                          borderRadius: "4px",
                          width: `${60 + Math.random() * 40}%`,
                          animation: "pulse 1.5s ease-in-out infinite",
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center" }}>
                    <Database size={32} color="#D1D5DB" style={{ margin: "0 auto 0.75rem" }} />
                    <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: 0 }}>
                      {search || riskFilter
                        ? "No predictions match your filters"
                        : "No predictions yet. Run a prediction to see it here!"}
                    </p>
                  </td>
                </tr>
              ) : (
                predictions.map((pred) => {
                  const style = RISK_STYLES[pred.risk_level.toLowerCase()] || RISK_STYLES.low;
                  return (
                    <tr key={pred.id} style={{ borderBottom: "1px solid #F3F4F6" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>
                        {pred.patient_id}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "#4B5563" }}>
                        {pred.age}y
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "#4B5563" }}>
                        {pred.pathology}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "#4B5563" }}>
                        {pred.t_stage} / {pred.n_stage}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.25rem 0.625rem",
                          background: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: style.dot }} />
                          {pred.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.9rem", fontWeight: 700, color: style.text }}>
                        {(pred.recurrence_probability * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", color: "#6B7280" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar size={11} />
                          {new Date(pred.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <Link href={`/dashboard/history/${pred.patient_id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.375rem 0.75rem",
                            background: "#F0FDFA",
                            color: "#0F766E",
                            border: "1px solid #A7F3D0",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "all 0.2s",
                          }}
                        >
                          <Eye size={12} />
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

        {/* Pagination */}
        {!loading && predictions.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.875rem 1rem",
            background: "#F9FAFB",
            borderTop: "1px solid #E5E7EB",
          }}>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>
              Showing <strong>{(page - 1) * 20 + 1}</strong>–<strong>{Math.min(page * 20, total)}</strong> of <strong>{total}</strong>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "0.375rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  background: page === 1 ? "#F3F4F6" : "white",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  color: page === 1 ? "#D1D5DB" : "#374151",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: "0.8rem", color: "#4B5563", minWidth: "80px", textAlign: "center" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "0.375rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  background: page === totalPages ? "#F3F4F6" : "white",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  color: page === totalPages ? "#D1D5DB" : "#374151",
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}