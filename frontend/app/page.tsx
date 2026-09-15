import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Footer } from "@/components/home/Footer";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LiveMarketSection } from "@/components/home/LiveMarketSection";
import { Navbar } from "@/components/home/Navbar";
import { TechStackStrip } from "@/components/home/TechStackStrip";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <LiveMarketSection />
      <FeatureGrid />
      <HowItWorks />
      <TechStackStrip />
      <Footer />
    </div>
  );
}
