"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm py-3"
          : "bg-white/60 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <Activity size={22} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-gray-900 text-2xl tracking-tight">
              Recura
            </span>
            <div className="text-[10px] text-blue-600 font-semibold tracking-widest -mt-1">
              CLINICAL AI PLATFORM
            </div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-gray-900 transition-all text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="group relative flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all whitespace-nowrap"
          >
            Get Started
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <button
          className="lg:hidden text-gray-700 hover:text-gray-900"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="lg:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-3 mt-3 shadow-lg"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-200 space-y-3">
            <Link
              href="/login"
              className="block text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white text-center shadow-lg shadow-blue-500/30"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}