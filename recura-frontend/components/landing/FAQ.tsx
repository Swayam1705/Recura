"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How accurate is the Recura prediction model?", a: "Our Deep 1D-CNN model achieves highly competitive validation accuracy on clinical testing datasets. It evaluates ATA risk categories, TNM staging, and post-op markers to output a reliable probability score." },
  { q: "How does the AI Note Parser work?", a: "It uses an LLM (Large Language Model) to read unstructured clinical notes. If the API is offline, a built-in regex fallback automatically extracts staging shorthand (e.g., 'T3b', 'N1a'), age, and pathology without failure." },
  { q: "Where is the patient data stored?", a: "Recura uses a local SQLite database designed for on-premise hospital deployments. No sensitive patient data is stored on external cloud servers, maintaining strict privacy compliance." },
  { q: "What is SHAP Explainable AI?", a: "SHAP (Shapley Additive Explanations) breaks open the 'black box' of AI. It tells the doctor exactly which factors (like Age or T-Stage) increased or decreased the risk score for that specific patient." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" style={{ padding: "6rem 1.5rem", backgroundColor: "#F8FAFC" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0F172A", marginBottom: "1rem" }}>Frequently Asked Questions</h2>
          <p style={{ color: "#475569", fontSize: "1.1rem" }}>Details on our methodology, data privacy, and AI architecture.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div key={faq.q} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ backgroundColor: "white", borderRadius: "1rem", border: isOpen ? "1px solid #93C5FD" : "1px solid #E2E8F0", boxShadow: isOpen ? "0 4px 15px rgba(0,0,0,0.05)" : "none", overflow: "hidden", transition: "all 0.2s" }}>
                <button onClick={() => setOpenIndex(isOpen ? null : idx)} style={{ width: "100%", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem", color: isOpen ? "#2563EB" : "#1E293B" }}>{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: isOpen ? "#2563EB" : "#94A3B8" }}><ChevronDown size={20} /></motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <div style={{ padding: "0 1.5rem 1.5rem", color: "#475569", lineHeight: 1.6, fontSize: "0.95rem" }}>{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}