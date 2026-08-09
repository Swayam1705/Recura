import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRiskColor(risk: "low" | "medium" | "high") {
  switch (risk) {
    case "low":
      return "text-emerald-400";
    case "medium":
      return "text-amber-400";
    case "high":
      return "text-red-400";
  }
}

export function getRiskBg(risk: "low" | "medium" | "high") {
  switch (risk) {
    case "low":
      return "bg-emerald-400/10 border-emerald-400/30";
    case "medium":
      return "bg-amber-400/10 border-amber-400/30";
    case "high":
      return "bg-red-400/10 border-red-400/30";
  }
}

export function formatProbability(value: number) {
  return `${Math.round(value * 100)}%`;
}
