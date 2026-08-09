"use client";

import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const shapData = [
  { name: "Tumor Size", value: 78, color: "bg-red-400" },
  { name: "Lymph Nodes", value: 65, color: "bg-red-400" },
  { name: "T Stage", value: 52, color: "bg-orange-400" },
  { name: "Age", value: 34, color: "bg-amber-400" },
  { name: "Focality", value: 22, color: "bg-emerald-400" },
];

export default function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-purple-400/20 rounded-3xl blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-blue-500/20 overflow-hidden"
      >
        <div className="h-11 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-md px-3 py-1 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              recura.app/dashboard
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-white to-blue-50/30 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Activity size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-gray-900 font-bold text-sm">Patient #1284</div>
                <div className="text-gray-500 text-[10px]">Analyzed 2 sec ago</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-700 text-[10px] font-bold">LIVE</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle size={18} className="text-red-600" />
                </div>
                <div>
                  <div className="font-bold text-red-700 text-base">High Risk</div>
                  <div className="text-red-600 text-xs">Recurrence detected</div>
                </div>
              </div>
              <div className="text-right">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="font-display text-3xl font-bold text-red-700"
                >
                  87%
                </motion.div>
                <div className="text-red-600 text-[10px] font-medium">Confidence 94%</div>
              </div>
            </div>
            <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "87%" }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <TrendingUp size={12} className="text-blue-600" />
              </div>
              <div className="font-bold text-gray-900 text-xs">
                SHAP Feature Importance
              </div>
            </div>
            <div className="space-y-2">
              {shapData.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-600 font-medium">{item.name}</span>
                    <span className="text-gray-900 font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2"
          >
            <Sparkles size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-blue-900 text-xs font-bold mb-0.5">
                AI Recommendation
              </div>
              <div className="text-blue-800 text-[11px] leading-snug">
                Recommend TSH monitoring every 3 months. Schedule imaging within 6 months.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, x: 20, y: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        transition={{ delay: 1.5, type: "spring" }}
        className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 flex items-center gap-2"
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-emerald-600" />
        </div>
        <div>
          <div className="text-gray-900 font-bold text-xs">Federated Learning</div>
          <div className="text-emerald-600 text-[10px] font-medium">156 hospitals synced</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, x: -20, y: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        transition={{ delay: 1.7, type: "spring" }}
        className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 flex items-center gap-2"
      >
        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
          <Brain size={18} className="text-purple-600" />
        </div>
        <div>
          <div className="text-gray-900 font-bold text-xs">2.3s Analysis</div>
          <div className="text-purple-600 text-[10px] font-medium">99.2% accurate</div>
        </div>
      </motion.div>
    </div>
  );
}