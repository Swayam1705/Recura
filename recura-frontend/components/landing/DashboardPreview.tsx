"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Shield, Zap, Network, Sparkles } from "lucide-react";

interface Particle {
  left: number;
  top: number;
  color: string;
  duration: number;
  delay: number;
}

export default function DashboardPreview() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setMounted(true);
    const colors = ["#3B82F6", "#06B6D4", "#8B5CF6"];
    const generated: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      generated.push({
        left: 10 + Math.random() * 80,
        top: 20 + Math.random() * 60,
        color: colors[i % 3],
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      });
    }
    setParticles(generated);
  }, []);

  if (!mounted) {
    return <div style={{ position: "relative", width: "100%", height: "600px" }} />;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      {/* Central glowing orb container */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",
        height: "300px",
      }}>
        {/* Outer pulsing rings */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: [0.5, 2, 0.5],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 4,
              delay: i * 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(59, 130, 246, 0.4)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Rotating gradient ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, #3B82F6, #06B6D4, #8B5CF6, #3B82F6)",
            padding: "3px",
            opacity: 0.8,
          }}
        >
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #1E293B, #0F172A)",
          }} />
        </motion.div>

        {/* Counter-rotating inner ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "30px",
            borderRadius: "50%",
            border: "2px dashed rgba(6, 182, 212, 0.5)",
          }}
        />

        {/* Central brain icon wrapper - Flex centered so Framer scale animation won't uncenter it */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 40px rgba(59, 130, 246, 0.5)",
                "0 0 80px rgba(59, 130, 246, 0.8)",
                "0 0 40px rgba(59, 130, 246, 0.5)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Brain size={56} color="white" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Data particles orbiting */}
        {[
          { angle: 0, color: "#3B82F6", delay: 0 },
          { angle: 60, color: "#06B6D4", delay: 0.5 },
          { angle: 120, color: "#8B5CF6", delay: 1 },
          { angle: 180, color: "#EC4899", delay: 1.5 },
          { angle: 240, color: "#F59E0B", delay: 2 },
          { angle: 300, color: "#10B981", delay: 2.5 },
        ].map((particle, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 10,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "0",
              height: "0",
              transformOrigin: "0 0",
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                delay: particle.delay,
                repeat: Infinity,
              }}
              style={{
                position: "absolute",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: particle.color,
                boxShadow: `0 0 20px ${particle.color}`,
                left: `${Math.cos((particle.angle * Math.PI) / 180) * 180}px`,
                top: `${Math.sin((particle.angle * Math.PI) / 180) * 180}px`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Floating info cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "16px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10B981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.5)",
          }}
        >
          <Shield size={20} color="white" />
        </motion.div>
        <div>
          <div style={{ color: "white", fontSize: "0.75rem", fontWeight: "700" }}>
            HIPAA Secured
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>
            Zero data leakage
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        style={{
          position: "absolute",
          top: "20%",
          right: "5%",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "16px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
          }}
        >
          <Network size={20} color="white" />
        </motion.div>
        <div>
          <div style={{ color: "white", fontSize: "0.75rem", fontWeight: "700" }}>
            Federated Learning
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>
            156 hospitals synced
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        style={{
          position: "absolute",
          bottom: "20%",
          left: "10%",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "16px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(6, 182, 212, 0.5)",
              "0 0 40px rgba(6, 182, 212, 0.8)",
              "0 0 20px rgba(6, 182, 212, 0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #06B6D4, #0891B2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={20} color="white" />
        </motion.div>
        <div>
          <div style={{ color: "white", fontSize: "0.75rem", fontWeight: "700" }}>
            98.7% Accuracy
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>
            Deep 1D-CNN
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.9, duration: 0.8 }}
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "16px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #EC4899, #DB2777)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(236, 72, 153, 0.5)",
          }}
        >
          <Sparkles size={20} color="white" />
        </motion.div>
        <div>
          <div style={{ color: "white", fontSize: "0.75rem", fontWeight: "700" }}>
            Explainable AI
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>
            SHAP + LIME
          </div>
        </div>
      </motion.div>

      {/* Connection lines - SVG */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.2,
        }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {[
          { x1: "15%", y1: "20%", x2: "50%", y2: "50%" },
          { x1: "85%", y1: "30%", x2: "50%", y2: "50%" },
          { x1: "20%", y1: "80%", x2: "50%", y2: "50%" },
          { x1: "80%", y1: "85%", x2: "50%", y2: "50%" },
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#lineGrad)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
      </svg>

      {/* Small floating particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
          }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}