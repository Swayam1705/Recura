"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100 opacity-60 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-100 opacity-60 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card relative z-10"
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ display: "inline-flex", justifyContent: "center", marginBottom: "2rem" }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo size="lg" showText />
            </motion.div>
          </Link>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "0.75rem",
            letterSpacing: "-0.025em",
            fontFamily: "var(--font-space)",
          }}>
            Welcome Back
          </h1>
          <p style={{ color: "#4B5563", fontSize: "1rem" }}>
            Sign in to access your clinical dashboard
          </p>
        </div>

        <div style={{
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          boxShadow: "0 20px 60px -15px rgba(59, 130, 246, 0.15)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "700", color: "#374151", marginBottom: "0.5rem" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@hospital.com"
                  style={{
                    width: "100%",
                    paddingLeft: "3rem",
                    paddingRight: "1rem",
                    paddingTop: "0.875rem",
                    paddingBottom: "0.875rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#F9FAFB",
                    border: "2px solid #E5E7EB",
                    color: "#111827",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3B82F6";
                    e.target.style.backgroundColor = "white";
                    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "700", color: "#374151", marginBottom: "0.5rem" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    paddingLeft: "3rem",
                    paddingRight: "3rem",
                    paddingTop: "0.875rem",
                    paddingBottom: "0.875rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#F9FAFB",
                    border: "2px solid #E5E7EB",
                    color: "#111827",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3B82F6";
                    e.target.style.backgroundColor = "white";
                    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", background: "none", border: "none" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: "#B91C1C", fontSize: "0.875rem", backgroundColor: "#FEF2F2", border: "2px solid #FECACA", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontWeight: "500" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4B5563", cursor: "pointer", fontWeight: "500" }}>
                <input type="checkbox" style={{ width: "1rem", height: "1rem" }} />
                Remember me
              </label>
              <Link
                href="#"
                style={{ color: "#2563EB", fontWeight: "700", textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                paddingTop: "1rem",
                paddingBottom: "1rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(to right, #2563EB, #1D4ED8)",
                fontWeight: "700",
                color: "white",
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                transition: "all 0.3s",
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(59, 130, 246, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(59, 130, 246, 0.4)";
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #F3F4F6", textAlign: "center" }}>
            <p style={{ color: "#4B5563", fontSize: "1rem" }}>
              Do not have an account?{" "}
              <Link
                href="/signup"
                style={{ color: "#2563EB", fontWeight: "700", textDecoration: "none" }}
              >
                Request Access
              </Link>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "2rem", color: "#6B7280", fontSize: "0.875rem", fontWeight: "500" }}>
          <Shield size={14} />
          Protected by enterprise-grade encryption
        </div>
      </motion.div>
    </div>
  );
}