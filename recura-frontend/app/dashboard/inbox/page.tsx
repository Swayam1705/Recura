"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Eye, Inbox, Pill, RefreshCw, Send, X } from "lucide-react";

function getDoctorId(): number {
  try {
    const raw = localStorage.getItem("recura_user");
    if (!raw) return 1;
    const u = JSON.parse(raw);
    return Number(u?.id || 1);
  } catch {
    return 1;
  }
}

export default function DoctorInboxPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingDemo, setSendingDemo] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [note, setNote] = useState("Your report is reviewed. Continue routine monitoring.");
  const [appointment, setAppointment] = useState("");
  const [saving, setSaving] = useState(false);
  const doctorId = useMemo(() => getDoctorId(), []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/pending-reviews?doctor_id=${doctorId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchReviews();
    const t = setInterval(fetchReviews, 8000);
    return () => clearInterval(t);
  }, [fetchReviews]);

  const openView = async (review: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/reviews/${review.id}`);
      if (res.ok) setActive(await res.json());
      else setActive(review);
    } catch {
      setActive(review);
    }
    setNote("Your report is reviewed. Continue routine monitoring.");
    setAppointment("");
  };

  const respond = async (action: string) => {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/doctor/respond-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: active.id,
          doctor_id: doctorId,
          action,
          doctor_note: note,
          appointment_time: appointment || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setActive(null);
      await fetchReviews();
      alert("Recommendation sent to patient.");
    } catch (err: any) {
      alert(err.message || "Failed to respond");
    } finally {
      setSaving(false);
    }
  };

  const sendDemo = async () => {
    setSendingDemo(true);
    try {
      await fetch("http://127.0.0.1:8000/patient/submit-to-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: "PT-P101",
          patient_name: "Sarah Jenkins (Demo)",
          doctor_id: doctorId,
          self_check_data: {
            status: "action_needed",
            color: "red",
            title: "Attention Required",
            message: "Tg elevated with mild neck swelling.",
            recommendation: "Doctor review advised",
            riskScore: 75,
            reasons: ["Tg = 1.4 ng/mL", "Neck lump reported"],
          },
        }),
      });
      await fetchReviews();
    } finally {
      setSendingDemo(false);
    }
  };

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800 }}>Patient Self-Check Inbox</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#64748B" }}>
            Open full report here (modal). Do not use History page for self-check IDs.
          </p>
        </div>
        <button type="button" onClick={sendDemo} disabled={sendingDemo} style={{ border: "1px solid #A7F3D0", background: "#F0FDFA", color: "#0F766E", borderRadius: 10, padding: "0.6rem 0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
          {sendingDemo ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
          Send Demo Report
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}><RefreshCw className="animate-spin" size={22} /></div>
      ) : reviews.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "2rem", textAlign: "center", color: "#64748B" }}>
          <Inbox size={34} style={{ margin: "0 auto 0.75rem" }} />
          No pending patient reports.
        </div>
      ) : (
        reviews.map((r) => {
          const sc = r.self_check_json || {};
          return (
            <div key={r.id} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{r.patient_name} <span style={{ color: "#64748B", fontFamily: "monospace" }}>({r.patient_id})</span></div>
                  <div style={{ color: "#94A3B8", fontSize: 12 }}>Submitted: {r.created_at}</div>
                </div>
                <span style={{ alignSelf: "start", background: "#FEF3C7", color: "#92400E", borderRadius: 999, padding: "0.2rem 0.65rem", fontSize: 11, fontWeight: 800 }}>
                  {(sc.status || "PENDING").toString().toUpperCase()}
                </span>
              </div>
              <p style={{ margin: "0.7rem 0", color: "#334155" }}>{sc.title || sc.message || "Patient self-check submitted"}</p>

              {/* IMPORTANT: type=button + preventDefault so it NEVER navigates to /history/PT-P1 */}
              <button
                type="button"
                onClick={(e) => openView(r, e)}
                style={{ border: "1px solid #CBD5E1", background: "#F8FAFC", borderRadius: 8, padding: "0.55rem 0.9rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}
              >
                <Eye size={15} /> View Full Report & Recommend
              </button>
            </div>
          );
        })
      )}

      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "grid", placeItems: "center", padding: 16 }} onClick={() => setActive(null)}>
          <div style={{ width: "min(720px, 100%)", background: "white", borderRadius: 14, padding: 18, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Self-Check Report</h2>
              <button type="button" onClick={() => setActive(null)} style={{ border: "none", background: "transparent", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>{active.patient_name} ({active.patient_id})</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>Review ID: {active.id} · Status: {active.status}</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>{active.self_check_json?.title || "Self-check"}</div>
              <div style={{ color: "#334155", marginTop: 4 }}>{active.self_check_json?.message}</div>
              <div style={{ marginTop: 8, fontSize: 13 }}><strong>Risk Score:</strong> {active.self_check_json?.riskScore ?? "N/A"}</div>
              <div style={{ marginTop: 4, fontSize: 13 }}><strong>AI Advice:</strong> {active.self_check_json?.recommendation || "—"}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#475569", fontSize: 13 }}>
                {(active.self_check_json?.reasons || []).map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            </div>

            <label style={{ fontWeight: 700, fontSize: 13 }}>Doctor Recommendation / Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} style={{ width: "100%", marginTop: 6, border: "1px solid #CBD5E1", borderRadius: 8, padding: 10 }} />

            <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginTop: 10 }}>Optional Appointment / Follow-up</label>
            <input value={appointment} onChange={(e) => setAppointment(e.target.value)} placeholder="e.g. Monday 10:00 AM clinic visit" style={{ width: "100%", marginTop: 6, border: "1px solid #CBD5E1", borderRadius: 8, padding: 10 }} />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <button type="button" disabled={saving} onClick={() => respond("ALL_CLEAR")} style={{ background: "#16A34A", color: "white", border: "none", borderRadius: 8, padding: "0.6rem 0.9rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                <CheckCircle size={15} /> All Clear
              </button>
              <button type="button" disabled={saving} onClick={() => respond("MONITOR")} style={{ background: "#D97706", color: "white", border: "none", borderRadius: 8, padding: "0.6rem 0.9rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Pill size={15} /> Monitor / Meds Advice
              </button>
              <button type="button" disabled={saving} onClick={() => respond("SCHEDULE_VISIT")} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "0.6rem 0.9rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Clock size={15} /> Request Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
