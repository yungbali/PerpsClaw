"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/stores/useAgentStore";

interface AgentHistoricalStats {
  totalTrades: number;
  cumulativePnl: number;
  winRate: number;
  totalSignals: number;
  lastActive: number;
  bestPnl: number;
  worstPnl: number;
}

interface StatsResponse {
  agents: Record<string, AgentHistoricalStats>;
  totalEntries: number;
  firstEntry: number;
  lastEntry: number;
}

export function useHistoricalStats() {
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data: StatsResponse = await res.json();

        if (data.agents) {
          const { setAgentStats } = useAgentStore.getState();
          for (const [agentId, stats] of Object.entries(data.agents)) {
            setAgentStats(agentId, {
              totalTrades: stats.totalTrades,
              cumulativePnl: stats.cumulativePnl,
              winRate: stats.winRate,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to fetch historical stats:", err);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
}
