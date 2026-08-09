import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import IntroSplash from "@/components/ui/IntroSplash";

export default function Home() {
  return (
    <>
      <IntroSplash />
      <main className="min-h-screen">
        <Hero />
        <Features />
      </main>
    </>
  );
}