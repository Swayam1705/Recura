"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse } from "lucide-react";

export default function PatientSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/patient/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, linked_doctor_id: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      localStorage.setItem("recura_patient_token", data.token);
      localStorage.setItem("recura_patient", JSON.stringify(data.patient));
      router.push("/patient/check");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const fields: Array<{ k: keyof typeof form; label: string; type: string; required: boolean }> = [
    { k: "name", label: "Full Name", type: "text", required: true },
    { k: "email", label: "Email", type: "email", required: true },
    { k: "phone", label: "Phone (optional)", type: "text", required: false },
    { k: "password", label: "Password", type: "password", required: true },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0F172A,#0F766E)", padding: 20 }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 440, background: "white", borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#0F766E,#0D9488)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartPulse size={20} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Patient Sign Up</h1>
            <p style={{ color: "#64748B", margin: 0, fontSize: 13 }}>Free recovery companion</p>
          </div>
        </div>

        {error && <div style={{ marginTop: 12, color: "#B91C1C", background: "#FEF2F2", padding: 10, borderRadius: 8, fontSize: 13 }}>{error}</div>}

        {fields.map((f) => (
          <div key={f.k}>
            <label style={{ display: "block", marginTop: 12, fontWeight: 600, fontSize: 14 }}>{f.label}</label>
            <input
              type={f.type}
              required={f.required}
              value={form[f.k]}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD5E1", marginTop: 4 }}
            />
          </div>
        ))}

        <button disabled={loading} style={{ marginTop: 18, width: "100%", padding: 12, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#0F766E,#0D9488)", color: "white", fontWeight: 700, cursor: "pointer" }}>
          {loading ? "Creating..." : "Create Patient Account"}
        </button>

        <p style={{ marginTop: 14, fontSize: 14, color: "#64748B" }}>
          Already have account? <Link href="/patient/login" style={{ color: "#0F766E", fontWeight: 700 }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
