"use client";

import { motion } from "framer-motion";
import { HelpCircle, Mail, FileText, Phone, BookOpen, ChevronRight } from "lucide-react";

export default function HelpSupportPage() {
  const faqs = [
    { q: "How is the recurrence probability calculated?", a: "Recura uses a Deep 1D-CNN ensemble model trained on clinical, pathology, and demographic data. It integrates SHAP and LIME algorithms to provide transparent feature attribution." },
    { q: "How does the ACR-TIRADS engine work?", a: "The engine maps your clinical inputs (like Nodule Size and Risk) to the official ACR-TIRADS 2017 radiology guidelines to recommend actions like FNA Biopsy." },
    { q: "Are patient records stored securely?", a: "Yes. All diagnostic predictions generate a cryptographic SHA-256 hash that is appended to our Federated Blockchain Ledger, ensuring tampering is impossible." },
    { q: "How do I use the Voice Dictation feature?", a: "Navigate to 'New Prediction' and click the 'Voice Dictate' button. Speak your clinical notes, and our NLP engine will auto-extract medical entities into the form." }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <HelpCircle size={28} color="#2563EB" /> Help & Clinical Support
        </h1>
        <p style={{ color: "#64748B", marginTop: "0.5rem" }}>Access documentation, FAQs, and contact the Recura engineering team.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <div style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #E2E8F0", background: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Mail size={20} color="#2563EB" />
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.125rem", color: "#0F172A" }}>Email Support</h3>
          <p style={{ margin: "0 0 16px 0", color: "#64748B", fontSize: "0.875rem", lineHeight: 1.5 }}>Get in touch with our clinical AI engineers for technical issues.</p>
          <a href="mailto:support@recura.ai" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none", fontSize: "0.875rem" }}>support@recura.ai →</a>
        </div>

        <div style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid #E2E8F0", background: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <BookOpen size={20} color="#16A34A" />
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.125rem", color: "#0F172A" }}>Clinical Guidelines</h3>
          <p style={{ margin: "0 0 16px 0", color: "#64748B", fontSize: "0.875rem", lineHeight: 1.5 }}>Read the ACR-TIRADS & ATA guidelines powering the engine.</p>
          <span style={{ color: "#16A34A", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>View Documentation →</span>
        </div>
      </div>

      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "1rem" }}>Frequently Asked Questions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid #E2E8F0", background: "white" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#1E293B", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}>
              <ChevronRight size={16} color="#94A3B8" /> {faq.q}
            </h4>
            <p style={{ margin: 0, color: "#64748B", fontSize: "0.875rem", paddingLeft: 24, lineHeight: 1.6 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}