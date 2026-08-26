import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import IntroSplash from "@/components/ui/IntroSplash";
import HowItWorks from "@/components/landing/HowItWorks";
import Methodology from "@/components/landing/Methodology";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <IntroSplash />
      <main className="min-h-screen bg-white">
        <Hero />
        <Features />
        <HowItWorks />
        <Methodology />
        <FAQ />
        <Footer />
      </main>
    </>
  );
}