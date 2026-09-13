"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronRight, UserPlus, History } from "lucide-react";

interface PatientSearchResult {
  patient_id: string;
  prediction_count: number;
  last_visit: string;
  last_risk: string;
  pathology: string;
  age: number;
}

interface PatientIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  mode: "new" | "followup";
  setMode: (mode: "new" | "followup") => void;
}

export default function PatientIdField({ value, onChange, mode, setMode }: PatientIdFieldProps) {
  const [patients, setPatients] = useState<PatientSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "new") return;
    
    const fetchPatients = async () => {
      try {
        // Use doctor ID 1 for demo purposes
        const res = await fetch(`http://127.0.0.1:8000/history/patients/search?q=${encodeURIComponent(value)}&doctor_id=1`);
        if (res.ok) {
          const data = await res.json();
          setPatients(Array.isArray(data) ? data : []);
        } else {
          setPatients([]);
        }
      } catch (err) {
        console.error("Patient search failed:", err);
        setPatients([]);
      }
    };

    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [value, mode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative", marginBottom: "1.5rem" }} ref={dropdownRef}>
      
      {/* Toggle Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => { setMode("new"); onChange(""); }}
          style={{
            flex: 1, padding: "0.6rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer",
            border: mode === "new" ? "2px solid #0F766E" : "1px solid #E5E7EB",
            background: mode === "new" ? "#F0FDFA" : "white",
            color: mode === "new" ? "#0F766E" : "#4B5563",
          }}
        >
          <UserPlus size={16} /> New Patient
        </button>
        <button
          type="button"
          onClick={() => { setMode("followup"); setShowDropdown(true); }}
          style={{
            flex: 1, padding: "0.6rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer",
            border: mode === "followup" ? "2px solid #2563EB" : "1px solid #E5E7EB",
            background: mode === "followup" ? "#EFF6FF" : "white",
            color: mode === "followup" ? "#1D4ED8" : "#4B5563",
          }}
        >
          <History size={16} /> Follow-up / Existing
        </button>
      </div>

      {/* Input Field */}
      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>
        {mode === "new" ? "Patient ID (Auto-generated)" : "Search Existing Patient ID"}
      </label>
      
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={mode === "new" ? "" : value}
          onChange={(e) => {
            if (mode === "followup") {
              onChange(e.target.value.toUpperCase());
              setShowDropdown(true);
            }
          }}
          onFocus={() => mode === "followup" && setShowDropdown(true)}
          placeholder={mode === "new" ? "Auto-assigned on submit (e.g., PT-000001)" : "Type to search past patients..."}
          disabled={mode === "new"}
          style={{
            width: "100%",
            padding: "0.65rem 0.85rem 0.65rem 2.25rem",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            fontSize: "0.9rem",
            fontFamily: "monospace",
            background: mode === "new" ? "#F9FAFB" : "white",
            cursor: mode === "new" ? "not-allowed" : "text",
            color: "#111827"
          }}
        />
        <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
      </div>

      {/* Dropdown for Follow-ups */}
      {showDropdown && mode === "followup" && (Array.isArray(patients) && patients.length > 0) && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "white",
          borderRadius: "10px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          zIndex: 50,
          maxHeight: "240px",
          overflowY: "auto",
        }}>
          <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", borderBottom: "1px solid #F3F4F6", textTransform: "uppercase" }}>
            {value ? "Matching Patients" : "Recent Patients"} ({patients.length})
          </div>
          {patients.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              onClick={() => {
                onChange(p.patient_id);
                setShowDropdown(false);
              }}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid #F9FAFB",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", color: "#111827" }}>
                  {p.patient_id}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  {p.pathology} · Age {p.age}
                </div>
              </div>
              <ChevronRight size={14} color="#9CA3AF" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
