"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import PredictionForm from "@/components/dashboard/PredictionForm";
import NoteParser from "@/components/dashboard/NoteParser";

export default function PredictPage() {
  const [prefillData, setPrefillData] = useState<any>(null);

  const handleExtract = (extracted: any) => {
    if (!extracted) return;

    // Normalize keys to match PredictionForm OPTIONS
    const normalized: any = {};

    if (extracted.age || extracted.Age) {
      normalized.Age = Number(extracted.age || extracted.Age);
    }

    if (extracted.response || extracted.Response) {
      normalized.Response = String(extracted.response || extracted.Response);
    }

    const r = String(extracted.risk || extracted.riskCategory || extracted.Risk || "").toLowerCase();
    if (r.includes("high")) normalized.Risk = "High";
    else if (r.includes("med") || r.includes("inter")) normalized.Risk = "Intermediate";
    else if (r.includes("low")) normalized.Risk = "Low";

    const t = String(extracted.tStage || extracted.T || extracted.t || "").toUpperCase();
    if (t.includes("T1A")) normalized.T = "T1a";
    else if (t.includes("T1B")) normalized.T = "T1b";
    else if (t.includes("T2")) normalized.T = "T2";
    else if (t.includes("T3A")) normalized.T = "T3a";
    else if (t.includes("T3B")) normalized.T = "T3b";
    else if (t.includes("T4A")) normalized.T = "T4a";
    else if (t.includes("T4B")) normalized.T = "T4b";
    else if (t.includes("T1")) normalized.T = "T1a";

    const n = String(extracted.nStage || extracted.N || extracted.n || "").toUpperCase();
    if (n.includes("N1A")) normalized.N = "N1a";
    else if (n.includes("N1B")) normalized.N = "N1b";
    else if (n.includes("N0")) normalized.N = "N0";

    if (extracted.physicalExam || extracted.Physical_Examination) {
      normalized.Physical_Examination = String(extracted.physicalExam || extracted.Physical_Examination);
    }

    if (extracted.pathology || extracted.Pathology) {
      const p = String(extracted.pathology || extracted.Pathology).toLowerCase();
      if (p.includes("micro")) normalized.Pathology = "Micropapillary";
      else if (p.includes("papi")) normalized.Pathology = "Papillary";
      else if (p.includes("folli")) normalized.Pathology = "Follicular";
      else if (p.includes("hurt")) normalized.Pathology = "Hurthel cell";
    }

    normalized._timestamp = Date.now();
    setPrefillData(normalized);

    // Smooth scroll down to prediction form
    setTimeout(() => {
      const formEl = document.getElementById("prediction-form-section");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div style={{ padding: "0.75rem", borderRadius: "14px", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "white" }}>
          <Brain size={26} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#0F172A" }}>New Clinical Prediction</h1>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>Dictate notes or fill clinical parameters for AI recurrence risk calculation</p>
        </div>
      </div>

      {/* Note Parser Box */}
      <NoteParser onExtract={handleExtract} />

      {/* Form Section */}
      <div id="prediction-form-section">
        <PredictionForm key={prefillData?._timestamp || "pred-form-default"} initialData={prefillData || {}} />
      </div>
    </div>
  );
}