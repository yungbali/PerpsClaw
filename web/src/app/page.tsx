"use client";

import { useEffect, useRef } from "react";
import { usePriceStore } from "@/stores/usePriceStore";
import { useAgentStore } from "@/stores/useAgentStore";
import { fetchSolPrice } from "@/lib/prices/pyth";
import { Hero } from "@/components/landing/Hero";
import { LiveStats } from "@/components/landing/LiveStats";
import { AgentShowcase } from "@/components/landing/AgentShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PerformancePreview } from "@/components/landing/PerformancePreview";
import { CopyTradingTeaser } from "@/components/landing/CopyTradingTeaser";
import { Architecture } from "@/components/landing/Architecture";
import { Footer } from "@/components/landing/Footer";

function useLandingData() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetchSolPrice()
      .then((data) => {
        usePriceStore.getState().setPrice({
          price: data.price,
          confidence: data.confidence,
          timestamp: data.publishTime,
          change24h: 0,
          changePct24h: 0,
        });
      })
      .catch(() => {});

    fetch("/api/stats")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data?.agents) return;
        const store = useAgentStore.getState();
        for (const [id, stats] of Object.entries(data.agents)) {
          const s = stats as { totalTrades: number; cumulativePnl: number; winRate: number };
          store.setAgentStats(id, {
            totalTrades: s.totalTrades,
            cumulativePnl: s.cumulativePnl,
            winRate: s.winRate,
          });
        }
      })
      .catch(() => {});
  }, []);
}

export default function Home() {
  useLandingData();

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
