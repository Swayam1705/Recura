"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  User,
  Building2,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hospital: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanName = formData.name.replace(/^Dr\.\s*/i, "").trim();
      const res = await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Dr. ${cleanName}`,
          email: formData.email,
          hospital: formData.hospital,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      localStorage.setItem("recura_token", data.token);
      localStorage.setItem("recura_user", JSON.stringify(data.doctor));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.9rem 1rem 0.9rem 2.75rem",
    borderRadius: "0.9rem",
    border: "1.5px solid #E2E8F0",
    fontSize: "0.95rem",
    color: "#0F172A",
    outline: "none",
    background: "#F8FAFC",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "0.5rem",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#2563EB";
    e.currentTarget.style.background = "white";
    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.12)";
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#E2E8F0";
    e.currentTarget.style.background = "#F8FAFC";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        background:
          "radial-gradient(ellipse at top, #EFF6FF 0%, #F8FAFC 45%, #FFFFFF 100%)",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#64748B",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "1.75rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(37, 99, 235, 0.35)",
              marginBottom: "1rem",
            }}
          >
            <Activity size={28} color="white" strokeWidth={2.5} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.02em",
            }}
          >
            Register clinical account
          </h1>
          <p
            style={{
              margin: "0.5rem 0 0",
              color: "#64748B",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              maxWidth: "360px",
            }}
          >
            Create a doctor account for your hospital or clinic
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "2rem 1.75rem",
            border: "1px solid #E2E8F0",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          }}
        >
          <form
            onSubmit={handleSignup}
            style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
          >
            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.85rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} color="#94A3B8" style={iconStyle} />
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Swayam Sharma"
                  style={fieldStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Clinical Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="#94A3B8" style={iconStyle} />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="doctor@hospital.com"
                  style={fieldStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Hospital / Clinic</label>
              <div style={{ position: "relative" }}>
                <Building2 size={18} color="#94A3B8" style={iconStyle} />
                <input
                  required
                  type="text"
                  value={formData.hospital}
                  onChange={(e) =>
                    setFormData({ ...formData, hospital: e.target.value })
                  }
                  placeholder="AIIMS / Apollo / Local Clinic"
                  style={fieldStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password (min 6 characters)</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#94A3B8" style={iconStyle} />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  style={fieldStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                padding: "0.95rem 1.25rem",
                borderRadius: "0.95rem",
                border: "none",
                background: loading
                  ? "#93C5FD"
                  : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 12px 28px rgba(37, 99, 235, 0.3)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating
                  account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#64748B",
            }}
          >
            Already registered?{" "}
            <Link
              href="/login"
              style={{
                color: "#2563EB",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>

        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#94A3B8",
          }}
        >
          For authorized clinicians only · Capstone research system
        </p>
      </motion.div>
    </div>
  );
}