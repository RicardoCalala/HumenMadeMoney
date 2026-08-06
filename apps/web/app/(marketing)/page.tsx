import { AIProof } from "@/components/marketing/AIProof";
import { EscrowTimeline } from "@/components/marketing/EscrowTimeline";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";

export default function Home() {
  return (
    <div id="top" className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <main>
        <Hero />
        <HowItWorks />
        <AIProof />
        <EscrowTimeline />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
