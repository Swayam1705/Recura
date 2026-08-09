"use client";

import { motion } from "framer-motion";
import { Brain, Shield, Network, Upload, FileText, Lock, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Explainable AI (XAI)",
    description:
      "SHAP and LIME visualizations show endocrinologists exactly why the model predicted recurrence — feature by feature, patient by patient.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "hover:border-blue-300",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: Shield,
    title: "Federated Learning",
    description:
      "Train models across hospital networks without ever centralizing patient data. HIPAA and DPDP compliant by design.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "hover:border-purple-300",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    icon: Network,
    title: "AI Clinical Agent",
    description:
      "Paste raw pathology reports. Our LLM agent extracts tumor size, TNM staging, hormone levels, and more — automatically.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "hover:border-emerald-300",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    icon: Upload,
    title: "Batch Processing",
    description:
      "Upload historical patient datasets in CSV format. Get bulk recurrence predictions with complete XAI explanations.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "hover:border-orange-300",
    gradient: "from-orange-500/10 to-red-500/10",
  },
  {
    icon: FileText,
    title: "Clinical PDF Reports",
    description:
      "One-click export of predictions, confidence scores, SHAP graphs, and recommendations into physician-ready PDF reports.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "hover:border-cyan-300",
    gradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "End-to-end encryption, role-based access, tamper-proof audit logs, and full compliance with healthcare data laws.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "hover:border-indigo-300",
    gradient: "from-indigo-500/10 to-purple-500/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-32 lg:py-40 relative bg-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24 max-w-4xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 text-blue-600 text-sm font-bold tracking-widest uppercase mb-6 px-5 py-2 bg-blue-50 rounded-full border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Platform Features
          </span>
          <h2 className="font-display text-5xl lg:text-7xl font-bold text-gray-900 mt-4 mb-8 tracking-tight leading-[1.05]">
            Built for{" "}
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
              Clinical Excellence
            </span>
          </h2>
          <p className="text-gray-600 text-xl lg:text-2xl leading-relaxed font-light">
            Every feature designed for endocrinologists, hospital administrators, and
            compliance officers dealing with thyroid cancer patients daily.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`group relative p-10 rounded-3xl border-2 border-gray-100 bg-white ${feature.border} hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <feature.icon size={30} className={feature.color} strokeWidth={2} />
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-6 rounded-3xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <Brain size={26} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 font-bold text-lg">
                Ready to transform your clinical workflow?
              </p>
              <p className="text-gray-600 text-sm">
                Join 2,400+ endocrinologists already using Recura
              </p>
            </div>
            <button className="ml-4 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white font-bold text-base hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}