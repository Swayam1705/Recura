"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Database, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Settings size={28} color="#475569" /> Platform Settings
        </h1>
        <p style={{ color: "#64748B", marginTop: "0.5rem" }}>Manage your clinical account, integrations, and security preferences.</p>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        
        {/* Sidebar Tabs */}
        <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { id: "profile", label: "Doctor Profile", icon: User },
            { id: "security", label: "Security & 2FA", icon: Shield },
            { id: "integrations", label: "EHR Integrations", icon: Database },
            { id: "notifications", label: "Notifications", icon: Bell }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "0.75rem 1rem", borderRadius: "10px",
                border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                background: activeTab === tab.id ? "#EFF6FF" : "transparent",
                color: activeTab === tab.id ? "#2563EB" : "#475569",
                textAlign: "left", transition: "all 0.2s"
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: "300px", background: "white", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "2rem" }}>
          
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#0F172A" }}>Doctor Profile</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Full Name</label>
                  <input type="text" defaultValue="Dr. Swayam" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #CBD5E1", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Hospital Affiliation</label>
                  <input type="text" defaultValue="Central Medical Institute" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #CBD5E1", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Email Address</label>
                  <input type="email" defaultValue="doctor@recura.ai" disabled style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#94A3B8", outline: "none" }} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "integrations" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#0F172A" }}>EHR & Blockchain Integrations</h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>FHIR / HL7 Interoperability</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748B" }}>Push diagnostic reports directly to hospital EHR systems.</div>
                </div>
                <div style={{ width: 44, height: 24, background: "#2563EB", borderRadius: 99, position: "relative" }}>
                  <div style={{ width: 18, height: 18, background: "white", borderRadius: 99, position: "absolute", right: 3, top: 3 }}></div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", border: "1px solid #E2E8F0", borderRadius: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>Federated Ledger Sync</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748B" }}>Commit predictions to immutable blockchain audit trail.</div>
                </div>
                <div style={{ width: 44, height: 24, background: "#2563EB", borderRadius: 99, position: "relative" }}>
                  <div style={{ width: 18, height: 18, background: "white", borderRadius: 99, position: "absolute", right: 3, top: 3 }}></div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#0F172A" }}>Security & Access</h2>
              <div style={{ padding: "1.25rem", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem", color: "#0F172A" }}>Two-Factor Authentication (2FA)</h3>
                <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#64748B" }}>Protect your clinical account with an additional layer of security.</p>
                <button style={{ padding: "0.5rem 1rem", background: "#0F172A", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Enable 2FA</button>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#0F172A" }}>Notification Preferences</h2>
              <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Email alerts for high-risk patient predictions are currently <strong>Enabled</strong>.</p>
            </motion.div>
          )}

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.75rem 1.5rem", background: "#2563EB", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
              <Save size={18} /> Save Changes
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}