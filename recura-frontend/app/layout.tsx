import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Recura | AI-Powered Thyroid Cancer Recurrence Detection",
  description:
    "Enterprise-grade federated learning platform for endocrinology. Predict thyroid cancer recurrence with zero data leakage and maximum accuracy.",
  keywords: [
    "thyroid cancer",
    "recurrence prediction",
    "AI endocrinology",
    "federated learning",
    "XAI",
    "explainable AI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <body
  suppressHydrationWarning
  className={`${inter.variable} ${spaceGrotesk.variable} bg-gray-50 text-gray-900 antialiased`}
>
        {children}
      </body>
    </html>
  );
}