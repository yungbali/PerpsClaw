"use client";

import { usePrices } from "@/hooks/usePrices";
import { useAgentPositions } from "@/hooks/useAgentPositions";
import { useHistoricalStats } from "@/hooks/useHistoricalStats";

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  usePrices();
  useAgentPositions();
  useHistoricalStats();

  return <>{children}</>;
}
