"use client";

import { useEffect, useRef } from "react";
import { AGENTS } from "@/config/agents";
import { useAgentStore, AgentPosition } from "@/stores/useAgentStore";
import { useTradeLogStore } from "@/stores/useTradeLogStore";
import { usePriceStore } from "@/stores/usePriceStore";

const POLL_INTERVAL = 5000;

export function useAgentPositions() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPositions = useRef<Record<string, AgentPosition | null>>({});

  useEffect(() => {
    // Skip if no agents have wallets configured
    const hasWallets = AGENTS.some((a) => !!a.wallet);
    if (!hasWallets) return;

    let mounted = true;

    async function poll() {
      try {
        // Dynamic import to avoid crashing during module evaluation
        const { getReadOnlyDriftClient } = await import("@/lib/drift/client");
        const { fetchAgentPosition } = await import("@/lib/drift/positions");
        const driftClient = await getReadOnlyDriftClient();

        for (const agent of AGENTS) {
          if (!agent.wallet || !mounted) continue;

          const position = await fetchAgentPosition(driftClient, agent.wallet);
          if (!mounted) break;

          // Detect position changes for trade log
          const prev = prevPositions.current[agent.id];
          if (prev && position) {
            const prevSize = prev.baseSize;
            const newSize = position.baseSize;

            if (Math.abs(newSize - prevSize) > 0.0001) {
              const currentPrice = usePriceStore.getState().price?.price ?? 0;
              let direction: "long" | "short" | "close";
              let size: number;
              let reason: string;

              if (newSize === 0) {
                direction = "close";
                size = Math.abs(prevSize);
                reason = "Position closed";
              } else if (Math.abs(newSize) > Math.abs(prevSize)) {
                direction = newSize > 0 ? "long" : "short";
                size = Math.abs(newSize - prevSize);
                reason = "Position increased";
              } else {
                direction = "close";
                size = Math.abs(prevSize - newSize);
                reason = "Position reduced";
              }

              useTradeLogStore.getState().addEntry({
                id: `${agent.id}-${Date.now()}`,
                agentId: agent.id,
                agentName: agent.name,
                timestamp: Date.now(),
                direction,
                size,
                price: currentPrice,
                reason,
              });
            }
          }

          prevPositions.current[agent.id] = position;

          useAgentStore.getState().setAgentStats(agent.id, {
            position,
            lastUpdate: Date.now(),
            isActive: position !== null,
          });
        }
      } catch (err) {
        console.warn("Agent position poll failed:", err);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
