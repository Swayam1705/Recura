"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeartPulse, LogOut } from "lucide-react";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("Patient");
  const isAuthPage = pathname === "/patient/login" || pathname === "/patient/signup";

  useEffect(() => {
    if (isAuthPage) return;
    const token = localStorage.getItem("recura_patient_token");
    const user = localStorage.getItem("recura_patient");
    if (!token || !user) {
      router.replace("/patient/login");
      return;
    }
    try {
      const p = JSON.parse(user);
      setName(p.name || "Patient");
    } catch {}
  }, [isAuthPage, router]);

  const logout = () => {
    localStorage.removeItem("recura_patient_token");
    localStorage.removeItem("recura_patient");
    router.push("/patient/login");
  };

  if (isAuthPage) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <header style={{ background: "white", borderBottom: "1px solid #E5E7EB", padding: "0.9rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/patient/check" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0F766E,#0D9488)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartPulse size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#0F172A" }}>Recura Patient</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Recovery Self-Check</div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>{name}</span>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, padding: "0.45rem 0.8rem", fontWeight: 600, cursor: "pointer" }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>{children}</main>

      <footer className="no-print" style={{ textAlign: "center", color: "#94A3B8", fontSize: 12, padding: "1rem" }}>
        Recura Patient Companion · Not a substitute for emergency medical care
      </footer>
    </div>
  );
}
