"use client";

import { motion } from "framer-motion";
import { Brain, Shield, Bot, Upload, FileText, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Explainable AI (XAI)",
    desc: "SHAP and LIME visualizations show endocrinologists exactly why the model predicted recurrence — feature by feature, patient by patient.",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    icon: Shield,
    title: "Federated Learning",
    desc: "Train models across hospital networks without ever centralizing patient data. Privacy-preserving and DPDP compliant by design.",
    color: "#9333EA",
    bg: "#F3E8FF",
  },
  {
    icon: Bot,
    title: "AI Clinical Agent",
    desc: "Paste raw pathology reports. Our LLM agent extracts tumor size, TNM staging, hormone levels, and more — automatically.",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    icon: Upload,
    title: "Batch Processing",
    desc: "Upload historical patient datasets in CSV format. Get bulk recurrence predictions with complete XAI explanations in seconds.",
    color: "#EA580C",
    bg: "#FFEDD5",
  },
  {
    icon: FileText,
    title: "Clinical PDF Reports",
    desc: "One-click export of predictions, confidence scores, SHAP graphs, and recommendations into physician-ready PDF reports.",
    color: "#0891B2",
    bg: "#CFFAFE",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "End-to-end encryption, role-based access, tamper-proof audit logs, and full compliance with healthcare data laws.",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: "6rem 1.5rem", backgroundColor: "#FFFFFF", width: "100%" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.875rem",
            borderRadius: "9999px",
            backgroundColor: "#EFF6FF",
            color: "#2563EB",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563EB" }}></span>
            PLATFORM FEATURES
          </div>
          <h2 style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            color: "#0F172A",
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
          }}>
            Built for <span style={{ color: "#2563EB" }}>Clinical</span> Excellence
          </h2>
          <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: 1.6 }}>
            Every feature designed for endocrinologists, hospital administrators, and compliance officers dealing with thyroid cancer patients daily.
          </p>
        </div>

        {/* Centered Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
          justifyContent: "center",
        }}>
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                style={{
                  backgroundColor: "white",
                  borderRadius: "1.25rem",
                  padding: "2rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  backgroundColor: feature.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}>
                  <Icon size={26} color={feature.color} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.5rem" }}>
                  {feature.title}
                </h3>
                <p style={{ color: "#475569", fontSize: "0.925rem", lineHeight: 1.6, margin: 0 }}>
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}