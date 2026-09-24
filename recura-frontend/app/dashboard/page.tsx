"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  Inbox,
  Loader2,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function getDoctor() {
  if (typeof window === "undefined") return { id: "1", name: "Doctor", hospital: "" };
  try {
    const raw = localStorage.getItem("recura_user");
    if (!raw) return { id: "1", name: "Doctor", hospital: "" };
    const u = JSON.parse(raw);
    return {
      id: String(u?.id || "1"),
      name: u?.name || "Doctor",
      hospital: u?.hospital || "",
    };
  } catch {
    return { id: "1", name: "Doctor", hospital: "" };
  }
}

export default function OverviewPage() {
  const [doctor, setDoctor] = useState({ id: "1", name: "Doctor", hospital: "" });
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState("");

  const load = useCallback(async () => {
    const d = getDoctor();
    setDoctor(d);
    setLoading(true);
    try {
      const q = `doctor_id=${d.id}`;
      const [sRes, pRes] = await Promise.all([
        fetch(`${API}/history/stats?${q}`),
        fetch(`${API}/doctor/pending-reviews?${q}`),
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (pRes.ok) {
        const p = await pRes.json();
        setPending(Array.isArray(p) ? p.slice(0, 5) : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      setNow(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(t);
  }, [load]);

  const cards = [
    { label: "Total Predictions", value: stats?.total_predictions ?? "—", icon: Database, color: "#2563EB", bg: "#EFF6FF" },
    { label: "Unique Patients", value: stats?.unique_patients ?? "—", icon: Users,
  CheckCircle, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "High Risk Cases", value: stats?.high_risk ?? "—", icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
    { label: "Medium Risk", value: stats?.medium_risk ?? "—", icon: TrendingUp, color: "#D97706", bg: "#FFFBEB" },
    { label: "Low Risk", value: stats?.low_risk ?? "—", icon: Activity, color: "#059669", bg: "#ECFDF5" },
    { label: "Last 7 Days", value: stats?.recent_7_days ?? "—", icon: Clock, color: "#0F766E", bg: "#F0FDFA" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #1D4ED8 100%)",
          borderRadius: 18,
          padding: "1.75rem 2rem",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          boxShadow: "0 10px 25px rgba(15, 118, 110, 0.25)",
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Clinical Workspace Overview
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Welcome back, {doctor.name}
          </h1>
          <p style={{ margin: "0.4rem 0 0", opacity: 0.9, fontSize: 14 }}>
            {doctor.hospital || "Recura Clinical AI"} · Your centralized command center
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Local time</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{now || "—"}</div>
          <button
            type="button"
            onClick={load}
            style={{
              marginTop: 12,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              borderRadius: 8,
              padding: "0.5rem 1rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 12,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            Refresh Dashboard
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, height: 120, display: "grid", placeItems: "center" }}>
                <Loader2 className="animate-spin" size={20} color="#94A3B8" />
              </div>
            ))
          : cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: 14,
                    padding: "1.25rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "grid", placeItems: "center", marginBottom: 12 }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
                    {c.value}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#64748B", fontWeight: 600 }}>{c.label}</div>
                </motion.div>
              );
            })}
      </div>

      {/* Side-by-Side Main Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Pending Inbox Panel */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "1.5rem", minHeight: 320, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", display: "flex", gap: 8, alignItems: "center", color: "#111827" }}>
              <Inbox size={20} color="#0F766E" /> Pending Patient Reports
            </h2>
            <Link href="/dashboard/inbox" style={{ fontSize: 13, fontWeight: 700, color: "#0F766E", textDecoration: "none", background: "#F0FDFA", padding: "0.4rem 0.8rem", borderRadius: 8 }}>
              Open Inbox →
            </Link>
          </div>

          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                <Loader2 className="animate-spin" size={24} color="#94A3B8" />
              </div>
            ) : pending.length === 0 ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", borderRadius: 12, color: "#64748B", border: "1px dashed #E2E8F0" }}>
                <CheckCircle size={32} color="#10B981" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600 }}>No pending reports</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>You are completely caught up!</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {pending.map((p) => (
                  <Link
                    key={p.id}
                    href="/dashboard/inbox"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "1rem",
                      background: "#F8FAFC",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{p.patient_name || "Patient"}</div>
                        <div style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace", marginTop: 2 }}>{p.patient_id}</div>
                      </div>
                      <span style={{ alignSelf: "start", fontSize: 11, fontWeight: 800, color: "#B45309", background: "#FEF3C7", borderRadius: 999, padding: "2px 8px" }}>
                        PENDING
                      </span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "#334155" }}>
                      {p.self_check_json?.title || p.self_check_json?.message || "Self-check submitted for review"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk Distribution Snapshot */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={20} color="#2563EB" /> Risk Distribution Snapshot
            </h2>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                <Loader2 className="animate-spin" size={24} color="#94A3B8" />
              </div>
            ) : !stats ? (
              <div style={{ textAlign: "center", color: "#64748B", fontSize: 14 }}>No data available</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {[
                  { label: "High Risk", value: stats.high_risk || 0, color: "#DC2626", bg: "#FEE2E2" },
                  { label: "Medium Risk", value: stats.medium_risk || 0, color: "#D97706", bg: "#FEF3C7" },
                  { label: "Low Risk", value: stats.low_risk || 0, color: "#059669", bg: "#D1FAE5" },
                ].map((r) => {
                  const total = Math.max(1, (stats.high_risk || 0) + (stats.medium_risk || 0) + (stats.low_risk || 0));
                  const pct = Math.round((r.value / total) * 100);
                  return (
                    <div key={r.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: r.color }}>{r.label}</span>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>
                          {r.value} <span style={{ opacity: 0.6 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 12, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ height: "100%", background: r.color, borderRadius: 999 }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 24, padding: "1rem", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Average Risk Score</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                      {((stats.avg_risk_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#94A3B8" }}>
                    Full historical records available in{" "}
                    <Link href="/dashboard/history" style={{ color: "#0F766E", fontWeight: 600, textDecoration: "none" }}>
                      Patient History
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
