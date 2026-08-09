"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

interface Particle {
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export default function IntroSplash() {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const hasSeenIntro = sessionStorage.getItem("recura_intro_seen");
    if (hasSeenIntro) {
      setShow(false);
      return;
    }

    const generated: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      generated.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      });
    }
    setParticles(generated);

    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 3200);
    const t4 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("recura_intro_seen", "true");
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!mounted || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        exit={{
          opacity: 0,
          scale: 1.1,
          filter: "blur(20px)",
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, #0F172A 0%, #050810 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                x: p.x,
                y: p.y,
                scale: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                boxShadow: "0 0 8px rgba(59, 130, 246, 0.8)",
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3], opacity: [0.6, 0] }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-blue-500"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3], opacity: [0.4, 0] }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity, delay: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-cyan-400"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3], opacity: [0.3, 0] }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity, delay: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-purple-400"
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {phase >= 0 && phase < 3 && (
              <motion.div
                key="logo"
                initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                animate={{
                  opacity: 1,
                  scale: phase === 1 ? 1.1 : 1,
                  rotateY: 0,
                }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  duration: 0.8,
                }}
                className="mb-8"
              >
                <motion.div
                  animate={{
                    filter: [
                      "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                      "drop-shadow(0 0 40px rgba(59, 130, 246, 0.8))",
                      "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Logo size="xl" showText={false} animated />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <motion.h1
                  className="font-display text-6xl lg:text-8xl font-bold tracking-tight mb-4"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    background:
                      "linear-gradient(90deg, #3B82F6, #06B6D4, #8B5CF6, #3B82F6)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  RECURA
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-blue-300 text-sm lg:text-base tracking-[0.4em] font-semibold uppercase mx-auto"
                >
                  Clinical AI Platform
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="text-gray-400 text-lg lg:text-xl mt-8 max-w-md text-center leading-relaxed"
              >
                Predicting thyroid cancer recurrence{" "}
                <span className="text-blue-400 font-medium">before it returns</span>
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="mt-12 w-64 h-1 bg-white/10 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 text-xs tracking-widest uppercase"
        >
          v2.4.1 · Enterprise Edition
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}