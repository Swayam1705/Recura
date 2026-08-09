import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        recura: {
          blue: "#0EA5E9",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          dark: "#050810",
          card: "#0D1117",
          border: "#1C2333",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        display: ["var(--font-space)"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px #0EA5E9" },
          "100%": { boxShadow: "0 0 40px #8B5CF6, 0 0 80px #0EA5E9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
