"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, User, Building, ArrowRight, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

const inputStyle = {
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
};

const iconStyle: React.CSSProperties = {
  position: "absolute",
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9CA3AF",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "700",
  color: "#374151",
  marginBottom: "0.5rem",
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "#3B82F6";
  e.target.style.backgroundColor = "white";
  e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "#E5E7EB";
  e.target.style.backgroundColor = "#F9FAFB";
  e.target.style.boxShadow = "none";
};

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor",
    hospital: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (err) {
      setError("Signup failed. Please try again.");
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
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
            Request Access
          </h1>
          <p style={{ color: "#4B5563", fontSize: "1rem" }}>
            Join thousands of endocrinologists using Recura
          </p>
        </div>

        <div style={{
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          boxShadow: "0 20px 60px -15px rgba(59, 130, 246, 0.15)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={iconStyle} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. John Smith"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={iconStyle} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@hospital.com"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Hospital / Institution</label>
              <div style={{ position: "relative" }}>
                <Building size={18} style={iconStyle} />
                <input
                  type="text"
                  name="hospital"
                  required
                  value={formData.hospital}
                  onChange={handleChange}
                  placeholder="City General Hospital"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Your Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: "100%",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  paddingTop: "0.875rem",
                  paddingBottom: "0.875rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#F9FAFB",
                  border: "2px solid #E5E7EB",
                  color: "#111827",
                  fontSize: "1rem",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <option value="doctor">Endocrinologist / Doctor</option>
                <option value="admin">Hospital Administrator</option>
                <option value="researcher">Clinical Researcher</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={iconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  style={{ ...inputStyle, paddingRight: "3rem" }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                    background: "none",
                    border: "none",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.5rem", fontWeight: "500" }}>
                Must be at least 8 characters with numbers and symbols
              </p>
            </div>

            {error && (
              <div style={{ color: "#B91C1C", fontSize: "0.875rem", backgroundColor: "#FEF2F2", border: "2px solid #FECACA", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontWeight: "500" }}>
                {error}
              </div>
            )}

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
                marginTop: "0.5rem",
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #F3F4F6", textAlign: "center" }}>
            <p style={{ color: "#4B5563", fontSize: "1rem" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                style={{ color: "#2563EB", fontWeight: "700", textDecoration: "none" }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "2rem", color: "#6B7280", fontSize: "0.875rem", fontWeight: "500" }}>
          <Shield size={14} />
          HIPAA Compliant · SOC 2 Certified · End-to-End Encrypted
        </div>
      </motion.div>
    </div>
  );
}