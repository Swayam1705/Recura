"use client";

import Link from "next/link";
import { Activity, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#020617", color: "#94A3B8", paddingTop: "5rem", paddingBottom: "2rem", borderTop: "1px solid #1E293B" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem", marginBottom: "4rem" }}>
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", textDecoration: "none" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={24} color="white" /></div>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>Recura</span>
            </Link>
            <p style={{ lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "1.5rem" }}>An open research project focused on explainable AI for clinical decision support in thyroid cancer recurrence.</p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <a href="https://github.com/Swayam1705/Recura.git" target="_blank" rel="noreferrer" style={{ color: "#94A3B8", textDecoration: "none" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>
              </a>
              <a href="mailto:contact@recura.health" style={{ color: "#94A3B8" }}><Mail size={24} /></a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "1.25rem" }}>Application</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li><Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>Dashboard</Link></li>
              <li><Link href="/dashboard/predict" style={{ color: "#94A3B8", textDecoration: "none" }}>New Prediction</Link></li>
              <li><Link href="/dashboard/history" style={{ color: "#94A3B8", textDecoration: "none" }}>Patient History</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "1.25rem" }}>Technology Stack</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3B82F6" }}></div> Next.js & React</li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }}></div> FastAPI & Python</li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }}></div> TensorFlow 1D-CNN</li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8B5CF6" }}></div> SQLite & SQLAlchemy</li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1E293B", paddingTop: "2rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem" }}>
          <p>© {new Date().getFullYear()} Developed by Swayam for Capstone Project.</p>
          <p>For academic and research purposes only.</p>
        </div>
      </div>
    </footer>
  );
}