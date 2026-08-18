"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, UserPlus, Search, X, Calendar, Activity, Sparkles } from "lucide-react";

interface ExistingPatient {
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
  mode: "new" | "existing";
  onModeChange: (mode: "new" | "existing") => void;
}

const RISK_COLORS: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
};

export default function PatientIdField({
  value,
  onChange,
  mode,
  onModeChange,
}: PatientIdFieldProps) {
  const [patients, setPatients] = useState<ExistingPatient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent patients on mount
  useEffect(() => {
    if (mode === "existing") fetchPatients("");
  }, [mode]);

  // Search patients
  const fetchPatients = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/history/patients/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setPatients(data || []);
    } catch (err) {
      console.error("Patient search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    onChange(val);
    if (mode === "existing") {
      fetchPatients(val);
      setShowDropdown(true);
    }
  };

  const selectPatient = (patient: ExistingPatient) => {
    onChange(patient.patient_id);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      {/* Mode Toggle */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "0.75rem",
        background: "#F3F4F6",
        padding: "4px",
        borderRadius: "10px",
      }}>
        <button
          type="button"
          onClick={() => { onModeChange("new"); onChange(""); }}
          style={{
            flex: 1,
            padding: "0.5rem",
            borderRadius: "8px",
            border: "none",
            background: mode === "new" ? "white" : "transparent",
            color: mode === "new" ? "#0F766E" : "#6B7280",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            boxShadow: mode === "new" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <UserPlus size={14} />
          New Patient
        </button>
        <button
          type="button"
          onClick={() => { onModeChange("existing"); onChange(""); }}
          style={{
            flex: 1,
            padding: "0.5rem",
            borderRadius: "8px",
            border: "none",
            background: mode === "existing" ? "white" : "transparent",
            color: mode === "existing" ? "#0F766E" : "#6B7280",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            boxShadow: mode === "existing" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <User size={14} />
          Follow-up Visit
        </button>
      </div>

      {/* Label */}
      <label style={{
        display: "block",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "0.5rem",
      }}>
        Patient ID
        {mode === "new" ? (
          <span style={{ color: "#9CA3AF", fontWeight: 400, marginLeft: "0.375rem" }}>
            (auto-generated if left blank)
          </span>
        ) : (
          <span style={{ color: "#0F766E", fontWeight: 500, marginLeft: "0.375rem", fontSize: "0.7rem" }}>
            ✨ Search existing patients
          </span>
        )}
      </label>

      {/* Input Field */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          {mode === "existing" && (
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
              }}
            />
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => mode === "existing" && setShowDropdown(true)}
            placeholder={
              mode === "new"
                ? "Leave blank for auto-generated ID (e.g. PT-000042)"
                : "Search: PT-000001, PT-000042..."
            }
            style={{
              width: "100%",
              padding: mode === "existing" ? "0.75rem 1rem 0.75rem 2.5rem" : "0.75rem 1rem",
              borderRadius: "10px",
              backgroundColor: "white",
              border: "1.5px solid #E5E7EB",
              color: "#111827",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = "#0F766E";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(15, 118, 110, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); inputRef.current?.focus(); }}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown for existing patients */}
        <AnimatePresence>
          {mode === "existing" && showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                zIndex: 20,
                maxHeight: "320px",
                overflow: "auto",
              }}
            >
              {loading ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.85rem" }}>
                  Searching...
                </div>
              ) : patients.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center" }}>
                  <User size={24} color="#D1D5DB" style={{ margin: "0 auto 0.5rem" }} />
                  <p style={{ color: "#6B7280", fontSize: "0.85rem", margin: 0 }}>
                    {value ? "No matching patients found" : "No patients yet"}
                  </p>
                  <p style={{ color: "#9CA3AF", fontSize: "0.7rem", marginTop: "0.25rem" }}>
                    Create your first patient using "New Patient" mode
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    padding: "0.5rem 0.875rem",
                    fontSize: "0.65rem",
                    color: "#6B7280",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid #F3F4F6",
                    background: "#F9FAFB",
                  }}>
                    {value ? "Search Results" : "Recent Patients"} ({patients.length})
                  </div>
                  {patients.map((patient) => (
                    <button
                      key={patient.patient_id}
                      type="button"
                      onClick={() => selectPatient(patient)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 0.875rem",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid #F3F4F6",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F0FDFA"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <User size={16} color="#2563EB" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "2px",
                        }}>
                          <span style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#111827",
                            fontSize: "0.85rem",
                          }}>
                            {patient.patient_id}
                          </span>
                          {patient.last_risk && (
                            <span style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: RISK_COLORS[patient.last_risk.toLowerCase()] || "#9CA3AF",
                            }} />
                          )}
                        </div>
                        <div style={{
                          fontSize: "0.7rem",
                          color: "#6B7280",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          flexWrap: "wrap",
                        }}>
                          <span>{patient.age}y · {patient.pathology}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <Activity size={10} />
                            {patient.prediction_count} visit{patient.prediction_count !== 1 ? "s" : ""}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <Calendar size={10} />
                            {new Date(patient.last_visit).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info hint */}
      {mode === "existing" && value && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 0.75rem",
            background: "#F0FDFA",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            fontSize: "0.75rem",
            color: "#065F46",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <Sparkles size={12} />
          This prediction will be added to <strong>{value}</strong>'s timeline
        </motion.div>
      )}
    </div>
  );
}