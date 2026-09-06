"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Bell, BellRing, CheckCheck, AlertTriangle, AlertCircle,
  CheckCircle, Loader2, Trash2, TestTube, Settings, Eye,
  Clock, Mail
} from "lucide-react";

interface Alert {
  id: number;
  patient_id: string;
  risk_level: string;
  risk_score: number;
  pathology: string;
  message: string;
  severity: string;
  acknowledged: number;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  email_sent: number;
  created_at: string;
}

interface Counts {
  total: number;
  unread: number;
  unread_high: number;
  unread_medium: number;
}

const RISK_STYLES: Record<string, any> = {
  high: {
    bg: "#FEE2E2",
    border: "#FECACA",
    text: "#991B1B",
    icon: AlertTriangle,
    dot: "#EF4444",
    accent: "#DC2626",
  },
  medium: {
    bg: "#FEF3C7",
    border: "#FCD34D",
    text: "#92400E",
    icon: AlertCircle,
    dot: "#F59E0B",
    accent: "#D97706",
  },
  low: {
    bg: "#D1FAE5",
    border: "#A7F3D0",
    text: "#065F46",
    icon: CheckCircle,
    dot: "#10B981",
    accent: "#059669",
  },
};

// Helper: get logged-in doctor's ID
function getDoctorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem("recura_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) return String(user.id);
    }
  } catch (e) {
    console.error(e);
  }
  return "";
}

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const [testing, setTesting] = useState(false);
  const [ackingAll, setAckingAll] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const docId = getDoctorId();
      const docParam = docId ? `&doctor_id=${docId}` : "";
      const docQuery = docId ? `?doctor_id=${docId}` : "";

      const [alertsRes, countsRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/alerts?unread_only=${filter === "unread"}&limit=100${docParam}`),
        fetch(`http://127.0.0.1:8000/alerts/counts${docQuery}`),
      ]);
      const alertsData = await alertsRes.json();
      const countsData = await countsRes.json();
      setAlerts(alertsData || []);
      setCounts(countsData);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const acknowledgeAlert = async (id: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/alerts/${id}/acknowledge`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.error("Ack failed:", err);
    }
  };

  const acknowledgeAll = async () => {
    setAckingAll(true);
    try {
      const docId = getDoctorId();
      const query = docId ? `?doctor_id=${docId}` : "";
      await fetch(`http://127.0.0.1:8000/alerts/acknowledge-all${query}`, { method: "POST" });
      fetchData();
    } finally {
      setAckingAll(false);
    }
  };

  const deleteAlert = async (id: number) => {
    if (!confirm("Delete this alert permanently?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/alerts/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const sendTestAlert = async () => {
    setTesting(true);
    try {
      await fetch("http://127.0.0.1:8000/alerts/test", { method: "POST" });
      fetchData();
    } finally {
      setTesting(false);
    }
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
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <BellRing size={32} color="#0F766E" />
            Clinical Alerts
          </h1>
          <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
            Real-time notifications for your high-risk patients.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={sendTestAlert}
            disabled={testing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 0.875rem",
              background: "white",
              color: "#6B7280",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
            {testing ? "Sending..." : "Send Test Alert"}
          </button>

          <Link
            href="/dashboard/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 0.875rem",
              background: "white",
              color: "#6B7280",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <Settings size={14} />
            Configure
          </Link>
        </div>
      </motion.div>

      {counts && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}>
          {[
            { label: "Total Alerts", value: counts.total, icon: Bell, color: "#3B82F6", bg: "#EFF6FF" },
            { label: "Unread", value: counts.unread, icon: BellRing, color: "#0F766E", bg: "#F0FDFA", pulse: counts.unread > 0 },
            { label: "High Risk (Unread)", value: counts.unread_high, icon: AlertTriangle, color: "#EF4444", bg: "#FEE2E2" },
            { label: "Medium Risk (Unread)", value: counts.unread_medium, icon: AlertCircle, color: "#F59E0B", bg: "#FEF3C7" },
          ].map((card, i) => {
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
                  position: "relative",
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
                  marginBottom: "0.75rem",
                  position: "relative",
                }}>
                  <Icon size={18} color={card.color} />
                  {card.pulse && card.value > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#EF4444",
                      border: "2px solid white",
                      animation: "pulse 2s infinite",
                    }} />
                  )}
                </div>
                <p style={{
                  fontFamily: "var(--font-space)",
                  fontSize: "1.75rem",
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
          })}
        </div>
      )}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        <div style={{
          display: "flex",
          gap: "0.5rem",
          background: "#F3F4F6",
          padding: "4px",
          borderRadius: "10px",
        }}>
          {[
            { key: "unread" as const, label: "Unread", count: counts?.unread || 0 },
            { key: "all" as const, label: "All", count: counts?.total || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: filter === tab.key ? "white" : "transparent",
                color: filter === tab.key ? "#0F766E" : "#6B7280",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                boxShadow: filter === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
              <span style={{
                padding: "0.125rem 0.375rem",
                background: filter === tab.key ? "#F0FDFA" : "#E5E7EB",
                color: filter === tab.key ? "#0F766E" : "#6B7280",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {counts && counts.unread > 0 && (
          <button
            onClick={acknowledgeAll}
            disabled={ackingAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.875rem",
              background: "linear-gradient(135deg, #0F766E, #0D9488)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: ackingAll ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {ackingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            {ackingAll ? "Marking..." : "Mark All Read"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Loader2 size={24} className="animate-spin" color="#0F766E" style={{ margin: "0 auto" }} />
          </div>
        ) : alerts.length === 0 ? (
          <div style={{
            background: "white",
            padding: "3rem",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            textAlign: "center",
          }}>
            <Bell size={40} color="#D1D5DB" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{
              fontFamily: "var(--font-space)",
              color: "#111827",
              fontWeight: 700,
              marginBottom: "0.5rem",
              fontSize: "1.1rem",
            }}>
              {filter === "unread" ? "All caught up!" : "No alerts yet"}
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              {filter === "unread"
                ? "You've acknowledged all clinical alerts."
                : "High-risk predictions in your workspace will appear here automatically."}
            </p>
            <button
              onClick={sendTestAlert}
              style={{
                padding: "0.5rem 1rem",
                background: "#F0FDFA",
                color: "#0F766E",
                border: "1px solid #A7F3D0",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Send a test alert
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const style = RISK_STYLES[alert.risk_level.toLowerCase()] || RISK_STYLES.low;
              const Icon = style.icon;
              const isUnread = !alert.acknowledged;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    border: `1px solid ${isUnread ? style.border : "#E5E7EB"}`,
                    overflow: "hidden",
                    boxShadow: isUnread ? `0 4px 12px ${style.dot}20` : "0 1px 3px rgba(0,0,0,0.05)",
                    position: "relative",
                  }}
                >
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: isUnread ? style.dot : "#E5E7EB",
                  }} />

                  <div style={{ padding: "1rem 1.25rem 1rem 1.5rem", display: "flex", gap: "1rem" }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      background: style.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                    }}>
                      <Icon size={20} color={style.accent} />
                      {isUnread && (
                        <span style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 10,
                          height: 10,
                          background: "#EF4444",
                          border: "2px solid white",
                          borderRadius: "50%",
                          animation: "pulse 2s infinite",
                        }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.375rem",
                        flexWrap: "wrap",
                      }}>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          background: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          borderRadius: "9999px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}>
                          {alert.risk_level} RISK
                        </span>
                        <Link
                          href={`/dashboard/history/${alert.patient_id}`}
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#111827",
                            textDecoration: "none",
                          }}
                        >
                          {alert.patient_id}
                        </Link>
                        <span style={{
                          fontSize: "0.75rem",
                          color: style.text,
                          fontWeight: 700,
                        }}>
                          · {(alert.risk_score * 100).toFixed(1)}%
                        </span>
                        {alert.email_sent > 0 && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.4rem",
                            background: "#F0FDFA",
                            color: "#0F766E",
                            borderRadius: "4px",
                            fontWeight: 600,
                          }}>
                            <Mail size={9} />
                            EMAILED
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: "0.875rem",
                        color: "#374151",
                        lineHeight: 1.5,
                        margin: "0 0 0.5rem",
                      }}>
                        {alert.message}
                      </p>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        fontSize: "0.7rem",
                        color: "#9CA3AF",
                        flexWrap: "wrap",
                      }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock size={10} />
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                        {alert.pathology && (
                          <span>· {alert.pathology}</span>
                        )}
                        {alert.acknowledged && alert.acknowledged_by && (
                          <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <CheckCircle size={10} />
                            Acknowledged by {alert.acknowledged_by}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                      alignItems: "flex-end",
                    }}>
                      {isUnread && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.375rem 0.75rem",
                            background: "#F0FDFA",
                            color: "#0F766E",
                            border: "1px solid #A7F3D0",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle size={12} />
                          Acknowledge
                        </button>
                      )}
                      <Link
                        href={`/dashboard/history/${alert.patient_id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.375rem 0.75rem",
                          background: "white",
                          color: "#6B7280",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <Eye size={12} />
                        View
                      </Link>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.375rem",
                          background: "transparent",
                          color: "#9CA3AF",
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="Delete alert"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}