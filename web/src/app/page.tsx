"use client";

import { usePrices } from "@/hooks/usePrices";
import { useHistoricalStats } from "@/hooks/useHistoricalStats";
import { Hero } from "@/components/landing/Hero";
import { LiveStats } from "@/components/landing/LiveStats";
import { AgentShowcase } from "@/components/landing/AgentShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PerformancePreview } from "@/components/landing/PerformancePreview";
import { CopyTradingTeaser } from "@/components/landing/CopyTradingTeaser";
import { Architecture } from "@/components/landing/Architecture";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  usePrices();
  useHistoricalStats();

  return (
    <div className="min-h-screen">
      <Hero />
      <LiveStats />
      <AgentShowcase />
      <HowItWorks />
      <PerformancePreview />
      <CopyTradingTeaser />
      <Architecture />
      <Footer />
    </div>
  );
}
