"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Zap, Brain } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

const badges = [
  { icon: Shield, text: "Privacy First" },
  { icon: Zap, text: "Federated Learning" },
  { icon: Brain, text: "Explainable AI" },
];

const stats = [
  { value: "98.7%", label: "Model Accuracy" },
  { value: "1D-CNN", label: "Core Architecture" },
  { value: "XAI", label: "SHAP + LIME" },
];

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Methodology", href: "#methodology" },
  { label: "FAQ", href: "#faq" },
];

export default function Hero() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Background video */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129957/3129957-uhd_3840_2160_25fps.mp4"
            type="video/mp4"
          />
        </video>

        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 58, 138, 0.75) 40%, rgba(12, 74, 110, 0.85) 100%)",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7))",
        }} />
      </div>

      {/* Ambient blobs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden", pointerEvents: "none" }}>
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: "25%",
            left: "25%",
            width: "600px",
            height: "600px",
            background: "rgba(59, 130, 246, 0.2)",
            borderRadius: "50%",
            filter: "blur(150px)",
          }}
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            bottom: "25%",
            right: "25%",
            width: "500px",
            height: "500px",
            background: "rgba(6, 182, 212, 0.2)",
            borderRadius: "50%",
            filter: "blur(150px)",
          }}
        />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(15, 23, 42, 0.3)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1.25rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(59, 130, 246, 0.5)",
            }}>
              <svg viewBox="0 0 100 100" width="26" height="26">
                <path
                  d="M20 55 L35 55 L42 40 L52 68 L60 48 L67 55 L80 55"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-space)",
                fontWeight: "700",
                color: "white",
                fontSize: "1.5rem",
                lineHeight: "1",
                letterSpacing: "-0.02em",
              }}>
                Recura
              </div>
              <div style={{
                color: "#93C5FD",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginTop: "4px",
              }}>
                Clinical AI Platform
              </div>
            </div>
          </Link>

          {/* Center links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "9999px",
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
            className="hidden lg:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right actions: Patient vs Doctor (separate portals) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="hidden lg:flex">
            <Link
              href="/patient/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#93C5FD",
                border: "1px solid rgba(147, 197, 253, 0.35)",
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                textDecoration: "none",
                borderRadius: "0.75rem",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                e.currentTarget.style.borderColor = "rgba(147, 197, 253, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.45)";
                e.currentTarget.style.borderColor = "rgba(147, 197, 253, 0.35)";
              }}
            >
               Patient Self-Check
            </Link>

            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "white",
                background: "linear-gradient(to right, #3B82F6, #2563EB)",
                borderRadius: "0.75rem",
                boxShadow: "0 10px 24px rgba(59, 130, 246, 0.5)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
               Doctor Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO CONTENT ===== */}
      <div style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        paddingTop: "8rem",
        paddingBottom: "6rem",
      }}>
        <div
          style={{
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
            padding: "0 2rem",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "4rem",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          <div style={{ maxWidth: "700px" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "9999px",
                backdropFilter: "blur(16px)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                marginBottom: "2rem",
              }}
            >
              <span style={{ position: "relative", display: "flex", height: "10px", width: "10px" }}>
                <span style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  borderRadius: "9999px",
                  backgroundColor: "#60A5FA",
                  opacity: 0.75,
                  animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                }} />
                <span style={{
                  position: "relative",
                  display: "inline-flex",
                  borderRadius: "9999px",
                  height: "10px",
                  width: "10px",
                  backgroundColor: "#3B82F6",
                }} />
              </span>
              <span style={{ color: "white", fontSize: "0.875rem", fontWeight: "600" }}>
                Capstone Clinical AI Research
              </span>
              <span style={{
                color: "#93C5FD",
                fontSize: "0.75rem",
                fontWeight: "500",
                borderLeft: "1px solid rgba(255, 255, 255, 0.2)",
                paddingLeft: "0.75rem",
              }}>
                v4.1
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              style={{
                fontFamily: "var(--font-space)",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                fontWeight: "700",
                lineHeight: "1.05",
                letterSpacing: "-0.02em",
                color: "white",
                marginBottom: "2rem",
              }}
            >
              Predict Thyroid{" "}
              <span style={{
                background: "linear-gradient(to right, #60A5FA, #22D3EE, #3B82F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Cancer Recurrence
              </span>{" "}
              Before It Returns
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                lineHeight: "1.6",
                marginBottom: "2rem",
                maxWidth: "600px",
                fontWeight: "300",
              }}
            >
              Research-grade{" "}
              <span style={{ color: "white", fontWeight: "500" }}>explainable AI</span> for
              clinical decision support  with SHAP transparency, note parsing, patient history,
              and high-risk alerts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "3.5rem" }}
            >
              {badges.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "9999px",
                    backdropFilter: "blur(16px)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  <Icon size={16} style={{ color: "#93C5FD" }} />
                  {text}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              style={{
                display: "flex",
                gap: "3rem",
                paddingTop: "2rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                flexWrap: "wrap",
              }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div style={{
                    fontFamily: "var(--font-space)",
                    fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                    fontWeight: "700",
                    color: "white",
                    lineHeight: "1",
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                    fontWeight: "500",
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="hero-preview-wrapper" style={{ display: "none" }}>
            <DashboardPreview />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1.2fr 1fr !important;
          }
          .hero-preview-wrapper {
            display: block !important;
          }
        }
      `}</style>
    </section>
  );
}
