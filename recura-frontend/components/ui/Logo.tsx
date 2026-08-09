"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark";
  animated?: boolean;
}

const sizeMap = {
  sm: { icon: 32, text: "text-lg", tag: "text-[9px]" },
  md: { icon: 44, text: "text-2xl", tag: "text-[10px]" },
  lg: { icon: 64, text: "text-4xl", tag: "text-xs" },
  xl: { icon: 120, text: "text-6xl", tag: "text-sm" },
};

export default function Logo({
  size = "md",
  showText = true,
  variant = "dark",
  animated = false,
}: LogoProps) {
  const s = sizeMap[size];
  const textColor = variant === "light" ? "text-white" : "text-gray-900";
  const tagColor = variant === "light" ? "text-blue-300" : "text-blue-600";

  const LogoSvg = (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="recuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="recuraGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.2" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="24"
        fill="url(#recuraGrad)"
      />

      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="24"
        fill="url(#recuraGlow)"
      />

      <path
        d="M20 55 L35 55 L42 40 L52 68 L60 48 L67 55 L80 55"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />

      <circle
        cx="80"
        cy="55"
        r="4"
        fill="white"
      />

      <circle
        cx="20"
        cy="55"
        r="3"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );

  return (
    <div className="flex items-center gap-3">
      {animated ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="flex-shrink-0"
        >
          {LogoSvg}
        </motion.div>
      ) : (
        <div className="flex-shrink-0">{LogoSvg}</div>
      )}

      {showText && (
        <div>
          <div className={`font-display font-bold ${textColor} ${s.text} tracking-tight leading-none`}>
            Recura
          </div>
          <div className={`${tagColor} ${s.tag} font-bold tracking-[0.2em] uppercase mt-0.5`}>
            Clinical AI
          </div>
        </div>
      )}
    </div>
  );
}