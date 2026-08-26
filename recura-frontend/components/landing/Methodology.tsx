"use client";

import { motion } from "framer-motion";
import { Activity, Target, Database } from "lucide-react";

export default function Methodology() {
  return (
    <section id="methodology" style={{ padding: "6rem 1.5rem", backgroundColor: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#0F172A", borderRadius: "1.5rem", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexWrap: "wrap" }}>
          
          <div style={{ flex: "1 1 500px", padding: "4rem 3rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", marginBottom: "1.5rem", lineHeight: 1.2 }}>
              Backed by Rigorous Machine Learning
            </h2>
            <p style={{ color: "#94A3B8", marginBottom: "2.5rem", lineHeight: 1.7, fontSize: "1.1rem" }}>
              Recura is built as a research initiative to solve the black-box problem in medical AI. We prioritize model transparency, high recall for at-risk patients, and robust validation across diverse datasets.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ padding: "0.75rem", backgroundColor: "rgba(59,130,246,0.2)", borderRadius: "0.75rem", color: "#60A5FA" }}>
                  <Target size={24} />
                </div>
                <div>
                  <h4 style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" }}>98.7% Validation Accuracy</h4>
                  <p style={{ color: "#94A3B8", fontSize: "0.9rem", lineHeight: 1.5 }}>Achieved on test splits using Deep 1D Convolutional Neural Networks.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ padding: "0.75rem", backgroundColor: "rgba(59,130,246,0.2)", borderRadius: "0.75rem", color: "#60A5FA" }}>
                  <Database size={24} />
                </div>
                <div>
                  <h4 style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" }}>Comprehensive Datasets</h4>
                  <p style={{ color: "#94A3B8", fontSize: "0.9rem", lineHeight: 1.5 }}>Trained on differentiated thyroid cancer records including T/N staging and pathology.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: "1 1 400px", backgroundColor: "#1E293B", padding: "4rem", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ width: "200px", height: "200px", borderRadius: "50%", border: "4px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "140px", height: "140px", borderRadius: "50%", backgroundColor: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(37,99,235,0.6)" }}>
                <Activity size={64} color="white" />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}