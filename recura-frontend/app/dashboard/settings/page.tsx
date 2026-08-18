"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bell, Mail, Sliders, Save, Plus, X, Loader2, CheckCircle,
  AlertTriangle, Settings as SettingsIcon, ArrowLeft
} from "lucide-react";

interface AlertConfig {
  high_risk_threshold: number;
  medium_risk_threshold: number;
  in_app_enabled: boolean;
  email_enabled: boolean;
  email_recipients: string[];
  notify_on_high: boolean;
  notify_on_medium: boolean;
  notify_on_low: boolean;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AlertConfig>({
    high_risk_threshold: 0.65,
    medium_risk_threshold: 0.40,
    in_app_enabled: true,
    email_enabled: false,
    email_recipients: [],
    notify_on_high: true,
    notify_on_medium: true,
    notify_on_low: false,
  });
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/alerts/config")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("http://127.0.0.1:8000/alerts/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    if (!config.email_recipients.includes(email)) {
      setConfig({ ...config, email_recipients: [...config.email_recipients, email] });
    }
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setConfig({ ...config, email_recipients: config.email_recipients.filter((e) => e !== email) });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={32} className="animate-spin" color="#0F766E" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" }}>
      <Link
        href="/dashboard/notifications"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          color: "#6B7280",
          textDecoration: "none",
          fontSize: "0.85rem",
          fontWeight: 500,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={14} />
        Back to Notifications
      </Link>

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
          <SettingsIcon size={28} color="#0F766E" />
          Alert Settings
        </h1>
        <p style={{ color: "#4B5563", marginTop: "0.5rem", fontSize: "1rem" }}>
          Configure when and how you receive clinical alerts
        </p>
      </div>

      {/* Risk Thresholds */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "#FEE2E2", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Sliders size={18} color="#DC2626" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, color: "#111827", fontFamily: "var(--font-space)", fontSize: "1rem" }}>
              Risk Thresholds
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.75rem" }}>
              Trigger alerts only when risk exceeds these levels
            </p>
          </div>
        </div>

        {[
          {
            key: "high_risk_threshold" as const,
            label: "High Risk Alert Threshold",
            desc: "Send urgent alerts when risk exceeds this value",
            color: "#DC2626",
          },
          {
            key: "medium_risk_threshold" as const,
            label: "Medium Risk Alert Threshold",
            desc: "Send warning alerts when risk exceeds this value",
            color: "#F59E0B",
          },
        ].map(({ key, label, desc, color }) => (
          <div key={key} style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color, display: "block" }}>
                  {label}
                </label>
                <p style={{ fontSize: "0.7rem", color: "#6B7280", marginTop: "2px" }}>{desc}</p>
              </div>
              <span style={{
                fontFamily: "var(--font-space)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color,
              }}>
                {(config[key] * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.99"
              step="0.01"
              value={config[key]}
              onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) })}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "9999px",
                appearance: "none",
                background: `linear-gradient(to right, ${color} 0%, ${color} ${config[key] * 100}%, #E5E7EB ${config[key] * 100}%, #E5E7EB 100%)`,
                cursor: "pointer",
              }}
            />
          </div>
        ))}
      </motion.div>

      {/* Notification Channels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "#EFF6FF", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={18} color="#2563EB" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, color: "#111827", fontFamily: "var(--font-space)", fontSize: "1rem" }}>
              Alert Rules
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.75rem" }}>
              Choose which risk levels trigger notifications
            </p>
          </div>
        </div>

        {[
          { key: "notify_on_high" as const, label: "High Risk Predictions", color: "#DC2626", dot: "#EF4444" },
          { key: "notify_on_medium" as const, label: "Medium Risk Predictions", color: "#D97706", dot: "#F59E0B" },
          { key: "notify_on_low" as const, label: "Low Risk Predictions", color: "#059669", dot: "#10B981" },
        ].map(({ key, label, color, dot }) => (
          <div
            key={key}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.875rem 1rem", background: "#F9FAFB",
              borderRadius: "10px", marginBottom: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: dot }} />
              <span style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 500 }}>{label}</span>
            </div>
            <button
              onClick={() => setConfig({ ...config, [key]: !config[key] })}
              style={{
                position: "relative", width: 42, height: 24,
                borderRadius: "9999px",
                background: config[key] ? color : "#D1D5DB",
                border: "none", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2,
                left: config[key] ? 20 : 2,
                width: 20, height: 20,
                background: "white", borderRadius: "50%",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        ))}
      </motion.div>

      {/* Email Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "10px",
              background: "#F0FDFA", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Mail size={18} color="#0F766E" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: "#111827", fontFamily: "var(--font-space)", fontSize: "1rem" }}>
                Email Notifications
              </h3>
              <p style={{ color: "#6B7280", fontSize: "0.75rem" }}>
                Send alerts to specified email addresses
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig({ ...config, email_enabled: !config.email_enabled })}
            style={{
              position: "relative", width: 42, height: 24,
              borderRadius: "9999px",
              background: config.email_enabled ? "#0F766E" : "#D1D5DB",
              border: "none", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 2,
              left: config.email_enabled ? 20 : 2,
              width: 20, height: 20,
              background: "white", borderRadius: "50%",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>

        {config.email_enabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                placeholder="doctor@hospital.com"
                style={{
                  flex: 1, padding: "0.625rem 0.875rem",
                  border: "1px solid #E5E7EB", borderRadius: "8px",
                  fontSize: "0.85rem", outline: "none",
                  color: "#111827",
                }}
              />
              <button
                onClick={addEmail}
                style={{
                  padding: "0.625rem 1rem",
                  background: "#0F766E", color: "white",
                  border: "none", borderRadius: "8px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
                  fontSize: "0.85rem", fontWeight: 600,
                }}
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {config.email_recipients.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#9CA3AF", fontStyle: "italic" }}>
                  No recipients added yet
                </p>
              ) : (
                config.email_recipients.map((email) => (
                  <div
                    key={email}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.375rem 0.75rem",
                      background: "#F0FDFA",
                      border: "1px solid #A7F3D0",
                      borderRadius: "9999px",
                      fontSize: "0.8rem", color: "#0F766E",
                    }}
                  >
                    <Mail size={11} />
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      style={{
                        background: "transparent", border: "none",
                        cursor: "pointer", color: "#0F766E",
                        display: "flex", alignItems: "center", padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{
              marginTop: "0.75rem", padding: "0.75rem",
              background: "#FEF3C7", border: "1px solid #FCD34D",
              borderRadius: "8px",
            }}>
              <p style={{ fontSize: "0.75rem", color: "#92400E", margin: 0, display: "flex", gap: "0.375rem" }}>
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong>Setup needed:</strong> Set environment variables <code>SMTP_USER</code> and <code>SMTP_PASS</code> in your backend. For Gmail, use an <a href="https://support.google.com/mail/answer/185833" target="_blank" style={{ color: "#92400E", textDecoration: "underline" }}>App Password</a>.
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Save button */}
      <button
        onClick={saveConfig}
        disabled={saving}
        style={{
          padding: "0.875rem 1.5rem",
          background: saved
            ? "linear-gradient(135deg, #10B981, #059669)"
            : "linear-gradient(135deg, #0F766E, #0D9488)",
          color: "white", border: "none", borderRadius: "10px",
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          fontWeight: 600, fontSize: "0.875rem",
          boxShadow: "0 10px 25px rgba(15, 118, 110, 0.25)",
        }}
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle size={16} /> Settings Saved!</>
        ) : (
          <><Save size={16} /> Save Configuration</>
        )}
      </button>
    </div>
  );
}