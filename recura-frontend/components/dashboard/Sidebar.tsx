"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  Upload,
  Settings,
  ChevronLeft,
  LogOut,
  Bell,
  HelpCircle,
  BarChart3,
  History,
  HeartPulse,
  Inbox,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useLiveAlertCount } from "../../hooks/useLiveAlertCount";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/predict", icon: Brain, label: "New Prediction" },
  { href: "/dashboard/inbox", icon: Inbox, label: "Patient Inbox" },
  { href: "/dashboard/batch", icon: Upload, label: "Batch Upload" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Model Analytics" },
  { href: "/dashboard/history", icon: History, label: "Patient History" },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

function getDoctorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem("recura_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) return String(user.id);
    }
  } catch (e) {
    console.error(e);
  }
  return "";
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const width = isOpen ? 280 : 88;
  const [mounted, setMounted] = useState(false);
  const [doctorName, setDoctorName] = useState("Doctor");
  const [doctorInitials, setDoctorInitials] = useState("DR");
  const [hospital, setHospital] = useState("");

  const doctorId = getDoctorId() || "1";
  const unreadCount = useLiveAlertCount(doctorId);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("recura_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setDoctorName(user.name || "Doctor");
        if (user.hospital) setHospital(user.hospital);

        const cleanName = (user.name || "Doctor").replace(/^Dr\.\s*/i, "").trim();
        const nameParts = cleanName.split(" ").filter(Boolean);
        if (nameParts.length >= 2) {
          setDoctorInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
        } else {
          setDoctorInitials(cleanName.substring(0, 2).toUpperCase());
        }
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("recura_token");
    localStorage.removeItem("recura_user");
    window.location.href = "/";
  };

  const bottomItems = [
    {
      href: "/dashboard/notifications",
      icon: Bell,
      label: "Notifications",
      badge: mounted ? unreadCount : 0,
    },
    { href: "/dashboard/help", icon: HelpCircle, label: "Help & Support" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        backgroundColor: "white",
        borderRight: "1px solid #E5E7EB",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem",
          borderBottom: "1px solid #F3F4F6",
          height: "80px",
          flexShrink: 0,
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 100 100" width="24" height="24">
                  <path
                    d="M20 55 L35 55 L42 40 L52 68 L60 48 L67 55 L80 55"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-space)",
                    fontWeight: "700",
                    color: "#111827",
                    fontSize: "1.25rem",
                    lineHeight: "1",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Recura
                </div>
                <div
                  style={{
                    color: "#2563EB",
                    fontSize: "9px",
                    fontWeight: "700",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginTop: "4px",
                  }}
                >
                  Clinical AI
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mini"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                margin: "0 auto",
              }}
            >
              <svg viewBox="0 0 100 100" width="24" height="24">
                <path
                  d="M20 55 L35 55 L42 40 L52 68 L60 48 L67 55 L80 55"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Doctor Profile Header */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
        {isOpen ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
              border: "1px solid #DBEAFE",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {doctorInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#111827", fontWeight: "700", fontSize: "0.875rem" }}>
                {doctorName}
              </div>
              <div style={{ color: "#6B7280", fontSize: "0.75rem" }}>
                {hospital || "Online Workspace"}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: "700",
              margin: "0 auto",
            }}
          >
            {doctorInitials}
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: "0.75rem", overflow: "auto" }}>
        {isOpen && (
          <div
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              padding: "0.75rem 0.75rem 0.5rem",
            }}
          >
            Main Menu
          </div>
        )}

        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = mounted && pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "12px",
                marginBottom: "4px",
                textDecoration: "none",
                position: "relative",
                backgroundColor: isActive ? "#EFF6FF" : "transparent",
                color: isActive ? "#1D4ED8" : "#4B5563",
                fontWeight: isActive ? "600" : "500",
                transition: "all 0.2s",
                justifyContent: isOpen ? "flex-start" : "center",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "4px",
                    height: "32px",
                    background: "linear-gradient(to bottom, #3B82F6, #2563EB)",
                    borderRadius: "0 4px 4px 0",
                  }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
              {isOpen && <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>{label}</span>}
            </Link>
          );
        })}

        {isOpen && (
          <div
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              padding: "1.5rem 0.75rem 0.5rem",
            }}
          >
            Account
          </div>
        )}

        {bottomItems.map(({ href, icon: Icon, label, badge }) => {
          const isActive = mounted && pathname === href;
          const hasBadge = badge !== undefined && badge > 0;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "12px",
                marginBottom: "4px",
                textDecoration: "none",
                backgroundColor: isActive ? "#EFF6FF" : "transparent",
                color: isActive ? "#1D4ED8" : "#4B5563",
                fontWeight: isActive ? "600" : "500",
                justifyContent: isOpen ? "flex-start" : "center",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Icon size={20} strokeWidth={2} />
                {!isOpen && hasBadge && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      backgroundColor: "#EF4444",
                      color: "white",
                      fontSize: "9px",
                      fontWeight: "700",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              {isOpen && (
                <>
                  <span style={{ fontSize: "0.875rem", flex: 1 }}>{label}</span>
                  {hasBadge && (
                    <span
                      style={{
                        backgroundColor: "#EF4444",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            borderRadius: "12px",
            color: "#DC2626",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "600",
            justifyContent: isOpen ? "flex-start" : "center",
          }}
        >
          <LogOut size={20} strokeWidth={2} />
          {isOpen && "Sign Out"}
        </button>
      </div>
    </motion.aside>
  );
}
