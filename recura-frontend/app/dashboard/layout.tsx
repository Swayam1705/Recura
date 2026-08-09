"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? 280 : 88;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 0.3s ease-in-out",
          minHeight: "100vh",
        }}
      >
        <div style={{
          padding: "2.5rem",
          maxWidth: "1600px",
          margin: "0 auto",
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}