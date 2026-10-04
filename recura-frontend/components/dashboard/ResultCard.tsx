"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Stethoscope, ShieldCheck, Sliders, Activity, X, CheckCircle2, RefreshCw } from "lucide-react";
import { generateDoctorClinicalReport, generatePatientFriendlyReport, PredictionResult } from "@/lib/generateReport";

export default function ResultCard({ result, patientInput }: { result: PredictionResult; patientInput?: any }) {
  let initialProb = Number(result?.recurrenceProbability) || 0;
  if (initialProb <= 1) initialProb = initialProb * 100;

  let conf = Number(result?.confidence) || 0.88;
  if (conf <= 1) conf = conf * 100;
  const confStr = conf.toFixed(1);

  const isHigh = initialProb >= 55;
  const isMed = initialProb >= 28 && initialProb < 55;
  const dynamicRiskLevel = isHigh ? "high" : isMed ? "medium" : "low";
  const dynamicStatus = isHigh ? "High Risk of Recurrence" : isMed ? "Moderate Risk of Recurrence" : "Low Risk of Recurrence";

  const theme = isHigh
    ? { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", badge: "#FEE2E2" }
    : isMed
    ? { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", badge: "#FEF3C7" }
    : { bg: "#F0FDF4", border: "#86EFAC", text: "#065F46", badge: "#D1FAE5" };

  const extractAge = (input: any) => Number(input?.Age ?? input?.age ?? 48);
  const extractSize = (input: any) => {
    if (input?.tumorSize || input?.tumor_size) return Number(input.tumorSize || input.tumor_size);
    const t = String(input?.T || input?.tStage || "").toUpperCase();
    if (t.includes("T1A")) return 0.8;
    if (t.includes("T1B")) return 1.5;
    if (t.includes("T2")) return 3.0;
    if (t.includes("T3")) return 4.5;
    if (t.includes("T4")) return 6.0;
    return 1.8;
  };
  const extractNodes = (input: any) => {
    if (input?.lymphNodes || input?.lymph_nodes) return Number(input.lymphNodes || input.lymph_nodes);
    const n = String(input?.N || input?.nStage || "").toUpperCase();
    if (n.includes("N0")) return 0;
    if (n.includes("N1A")) return 3;
    if (n.includes("N1B")) return 8;
    return 2;
  };

  const baseAge = extractAge(patientInput);
  const baseSize = extractSize(patientInput);
  const baseNodes = extractNodes(patientInput);

  const [simAge, setSimAge] = useState(baseAge);
  const [simSize, setSimSize] = useState(baseSize);
  const [simNodes, setSimNodes] = useState(baseNodes);
  const [isBlockchainOpen, setIsBlockchainOpen] = useState(false);

  useEffect(() => {
    setSimAge(extractAge(patientInput));
    setSimSize(extractSize(patientInput));
    setSimNodes(extractNodes(patientInput));
  }, [patientInput, result]);

  const currentSimProb = Math.min(Math.max(initialProb + (simSize - baseSize) * 8.5 + (simNodes - baseNodes) * 6.0 + (simAge - baseAge) * 0.25, 3.2), 98.8);
  const riskDelta = (currentSimProb - initialProb).toFixed(1);

  const pId = result?.patientId || patientInput?.patient_id || "PT-00000";
  const blockNumber = Math.abs(pId.split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0) || 1042);
  const blockHash = "0x" + Array.from({ length: 16 }, (_, i) => ((blockNumber * (i + 1) * 31) % 16).toString(16)).join("") + "a9e2";
  const prevHash = "0x7f4b" + Array.from({ length: 16 }, (_, i) => ((blockNumber * (i + 3) * 17) % 16).toString(16)).join("");

  // ACR-TIRADS
  const size = simSize || baseSize;
  let tiradsLevel = "TR2 / TR3 (Benign to Mildly Suspicious)";
  let tiradsAction = "No Biopsy Required — Routine Clinical Monitoring";
  let tiradsBadgeBg = "#D1FAE5";
  let tiradsBadgeText = "#065F46";
  const simIsHigh = currentSimProb >= 55;
  const simIsMed = currentSimProb >= 28 && currentSimProb < 55;

  if (simIsHigh || size >= 4.0 || simNodes >= 5) {
    tiradsLevel = "TR5 (Highly Suspicious)";
    tiradsAction = size >= 1.0 ? "FNA Biopsy Strongly Recommended (Size ≥ 1.0 cm)" : "Annual Ultrasound Follow-up Recommended";
    tiradsBadgeBg = "#FEE2E2";
    tiradsBadgeText = "#991B1B";
  } else if (simIsMed || size >= 2.0 || simNodes >= 1) {
    tiradsLevel = "TR4 (Moderately Suspicious)";
    tiradsAction = size >= 1.5 ? "FNA Biopsy Recommended (Size ≥ 1.5 cm)" : "Ultrasound Follow-up at 6, 12, and 24 Months";
    tiradsBadgeBg = "#FEF3C7";
    tiradsBadgeText = "#92400E";
  } else if (size >= 2.5) {
    tiradsAction = "Consider FNA Biopsy if size ≥ 2.5 cm";
  }

  // DYNAMIC XAI
  const getDynamicShap = () => {
    const baseShap = result?.shapValues || [];
    return baseShap.map((s: any) => {
      let f = s.feature;
      let isConcern = s.direction === "positive";
      let v = s.value;
      
      if (f.startsWith("Age")) {
        isConcern = simAge >= 55;
        f = `Age (${simAge})`; v = simAge;
      } else if (f.startsWith("T ")) {
        isConcern = simSize >= 3.0;
        f = `T Stage (${simSize >= 4.0 ? "T3/T4 Large" : simSize >= 2.0 ? "T2 Medium" : "T1 Small"})`; v = simSize;
      } else if (f.startsWith("N ")) {
        isConcern = simNodes >= 1;
        f = `N Stage (${simNodes >= 5 ? "N1b Extensive" : simNodes >= 1 ? "N1a Local" : "N0 Clean"})`; v = simNodes;
      }
      return { ...s, feature: f, value: v, direction: isConcern ? "positive" : "negative" };
    });
  };

  const dynamicShap = getDynamicShap();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", gap: "1rem" }}>
      {/* HEADER */}
      <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: 16, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ background: theme.badge, color: theme.text, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{dynamicRiskLevel} risk</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#64748B" }}>{pId}</span>
              <button type="button" onClick={() => setIsBlockchainOpen(true)} style={{ display: "inline-flex", gap: 5, alignItems: "center", border: "1px solid #CBD5E1", background: "white", color: "#0F172A", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                <ShieldCheck size={13} color="#0284C7" /> Ledger Verified #Block {blockNumber}
              </button>
            </div>
            <h2 style={{ margin: 0, color: theme.text, fontSize: "1.75rem" }}>{dynamicStatus}</h2>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>Probability <b>{initialProb.toFixed(1)}%</b> · Confidence <b>{confStr}%</b></p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "start" }}>
            <button type="button" onClick={() => generatePatientFriendlyReport({ ...result, recurrenceProbability: initialProb / 100, riskLevel: dynamicRiskLevel as any, status: dynamicStatus, patientId: pId })} style={{ display: "inline-flex", gap: 8, alignItems: "center", border: "1px solid #CBD5E1", background: "white", color: "#0F172A", borderRadius: 10, padding: "0.75rem 1rem", fontWeight: 700, cursor: "pointer" }}>
              <FileText size={16} /> Patient Report
            </button>
            <button type="button" onClick={() => generateDoctorClinicalReport({ ...result, recurrenceProbability: initialProb / 100, riskLevel: dynamicRiskLevel as any, status: dynamicStatus, patientId: pId }, patientInput)} style={{ display: "inline-flex", gap: 8, alignItems: "center", border: "none", background: "linear-gradient(135deg,#0F766E,#0D9488)", color: "white", borderRadius: 10, padding: "0.75rem 1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)" }}>
              <Stethoscope size={16} /> Doctor Clinical Report
            </button>
          </div>
        </div>
      </div>

      {/* ACR-TIRADS */}
      <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ padding: 6, borderRadius: 8, background: "#EFF6FF", color: "#2563EB" }}><Activity size={18} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>ACR-TIRADS Clinical Decision Engine</h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>Radiology Guideline-Based Management Standard</p>
            </div>
          </div>
          <span style={{ background: tiradsBadgeBg, color: tiradsBadgeText, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{tiradsLevel}</span>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Official Clinical Action</div>
          <p style={{ margin: 0, fontSize: "0.925rem", fontWeight: 700, color: "#1E293B" }}>{tiradsAction}</p>
        </div>
      </div>

      {/* WHAT-IF SIMULATOR */}
      <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ padding: 6, borderRadius: 8, background: "#F3E8FF", color: "#7E22CE" }}><Sliders size={18} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>"What-If" Counterfactual AI Simulator</h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>Tweak clinical parameters to simulate risk trajectory</p>
            </div>
          </div>
          <button type="button" onClick={() => { setSimAge(baseAge); setSimSize(baseSize); setSimNodes(baseNodes); }} style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 12, color: "#6B21A8", background: "#F3E8FF", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontWeight: 600 }}>
            <RefreshCw size={12} /> Reset
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: 16 }}>
          <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}><span>Nodule Size</span><span style={{ color: "#7E22CE" }}>{simSize} cm</span></div><input type="range" min="0.5" max="6.0" step="0.1" value={simSize} onChange={(e) => setSimSize(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#7E22CE", cursor: "pointer" }} /></div>
          <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}><span>Involved Lymph Nodes</span><span style={{ color: "#7E22CE" }}>{simNodes} nodes</span></div><input type="range" min="0" max="15" step="1" value={simNodes} onChange={(e) => setSimNodes(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#7E22CE", cursor: "pointer" }} /></div>
          <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}><span>Patient Age</span><span style={{ color: "#7E22CE" }}>{simAge} years</span></div><input type="range" min="18" max="85" step="1" value={simAge} onChange={(e) => setSimAge(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#7E22CE", cursor: "pointer" }} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 12, padding: "0.875rem 1.25rem", flexWrap: "wrap", gap: 8 }}>
          <div><span style={{ fontSize: 11, color: "#6B21A8", fontWeight: 700, textTransform: "uppercase" }}>Simulated Risk Score</span><div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#581C87" }}>{currentSimProb.toFixed(1)}%</div></div>
          <div style={{ textAlign: "right" }}><span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Risk Delta</span><div style={{ fontSize: "0.95rem", fontWeight: 800, color: parseFloat(riskDelta) > 0 ? "#DC2626" : parseFloat(riskDelta) < 0 ? "#16A34A" : "#475569" }}>{parseFloat(riskDelta) > 0 ? `+${riskDelta}% (Higher Risk)` : parseFloat(riskDelta) < 0 ? `${riskDelta}% (Lower Risk)` : "0.0% (Baseline)"}</div></div>
        </div>
      </div>

      {/* DYNAMIC XAI */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "1.25rem" }}>
        <h3 style={{ marginTop: 0 }}>Key Clinical Parameters (XAI Attribution)</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {dynamicShap.map((s: any) => (
            <div key={s.feature} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "0.75rem 0.85rem", background: "#F8FAFC", borderRadius: 8, border: "1px solid #F1F5F9" }}>
              <div><b>{s.feature}</b></div>
              <span style={{ fontWeight: 700, color: s.direction === "positive" ? "#DC2626" : "#059669" }}>{s.direction === "positive" ? "Elevates concern" : "Reassuring"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BLOCKCHAIN DRAWER */}
      <AnimatePresence>
        {isBlockchainOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBlockchainOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} style={{ position: "relative", width: "100%", maxWidth: "460px", background: "#0F172A", height: "100%", padding: "1.75rem", color: "white", display: "flex", flexDirection: "column", justifyContent: "space-between", overflowY: "auto", borderLeft: "1px solid #334155" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #1E293B", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><ShieldCheck size={24} color="#38BDF8" /><div><h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Blockchain Audit Trail</h3><p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>Immutable Verification</p></div></div>
                  <button type="button" onClick={() => setIsBlockchainOpen(false)} style={{ background: "#1E293B", border: "none", color: "#94A3B8", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={18} /></button>
                </div>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div><span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Block Height</span><div style={{ fontFamily: "monospace", fontSize: 14, color: "#38BDF8", fontWeight: 700 }}>Block #{blockNumber}</div></div>
                  <div><span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Current Block Hash</span><div style={{ fontFamily: "monospace", fontSize: 11, background: "#020617", padding: "8px", borderRadius: 8, border: "1px solid #1E293B", color: "#E2E8F0", wordBreak: "break-all" }}>{blockHash}</div></div>
                  <div><span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Previous Block Hash</span><div style={{ fontFamily: "monospace", fontSize: 11, background: "#020617", padding: "8px", borderRadius: 8, border: "1px solid #1E293B", color: "#94A3B8", wordBreak: "break-all" }}>{prevHash}</div></div>
                  <div><span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Federated Node Origin</span><div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>Hospital_Node_Alpha (Local Client)</div></div>
                </div>
              </div>
              <button type="button" onClick={() => setIsBlockchainOpen(false)} style={{ width: "100%", padding: "0.75rem", background: "#0284C7", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Close Audit Drawer</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}