"use client";

import { useEffect, useRef } from "react";
import { usePrices } from "@/hooks/usePrices";
import { useAgentPositions } from "@/hooks/useAgentPositions";
import { useAgentStore } from "@/stores/useAgentStore";

export function ArenaProvider({ children }: { children: React.ReactNode }) {
  usePrices();
  useAgentPositions();
  useHistoricalStats();

  return <>{children}</>;
}

function useHistoricalStats() {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = await res.json();

        if (data.agents) {
          const store = useAgentStore.getState();
          for (const [agentId, stats] of Object.entries(data.agents)) {
            const s = stats as { totalTrades: number; cumulativePnl: number; winRate: number };
            store.setAgentStats(agentId, {
              totalTrades: s.totalTrades,
              cumulativePnl: s.cumulativePnl,
              winRate: s.winRate,
            });
          }
        }
      } catch {
        // silently fail
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
}
