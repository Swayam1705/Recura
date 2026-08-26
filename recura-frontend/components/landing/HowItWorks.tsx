"use client";

import { motion } from "framer-motion";
import { FileText, Cpu, Stethoscope } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    { 
      step: "01", 
      title: "Input Patient Data", 
      desc: "Paste raw clinical notes. Our LLM agent extracts TNM staging, pathology, and demographics automatically.", 
      icon: FileText 
    },
    { 
      step: "02", 
      title: "AI Analysis", 
      desc: "The Deep 1D-CNN model evaluates the data against training patterns, calculating a calibrated recurrence probability.", 
      icon: Cpu 
    },
    { 
      step: "03", 
      title: "Clinical Action", 
      desc: "Review SHAP explainability graphs, receive automated high-risk alerts, and export PDF reports for the patient file.", 
      icon: Stethoscope 
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: "6rem 1.5rem", backgroundColor: "#F8FAFC" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0F172A", marginBottom: "1rem", fontFamily: "sans-serif" }}>
            Seamless Clinical Workflow
          </h2>
          <p style={{ color: "#475569", maxWidth: "600px", margin: "0 auto", fontSize: "1.1rem", lineHeight: 1.6 }}>
            Designed to integrate instantly into existing hospital practices without adding administrative burden to doctors.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "3rem", position: "relative" }}>
          {steps.map((item, idx) => (
            <motion.div 
              key={item.step} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: idx * 0.2 }} 
              style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", zIndex: 10 }}
            >
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", backgroundColor: "white", border: "4px solid #EFF6FF", boxShadow: "0 10px 25px rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <item.icon size={40} color="#2563EB" />
              </div>
              <div style={{ color: "#2563EB", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "1rem" }}>{item.title}</h3>
              <p style={{ color: "#475569", lineHeight: 1.6, padding: "0 1rem" }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}