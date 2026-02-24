import { create } from "zustand";
import { AgentPosition } from "@/lib/drift/positions";

export interface AgentStats {
  position: AgentPosition | null;
  cumulativePnl: number;
  totalTrades: number;
  winRate: number;
  lastUpdate: number;
  isActive: boolean;
}

interface AgentState {
  agents: Record<string, AgentStats>;
  setAgentStats: (agentId: string, stats: Partial<AgentStats>) => void;
}

const defaultStats: AgentStats = {
  position: null,
  cumulativePnl: 0,
  totalTrades: 0,
  winRate: 0,
  lastUpdate: 0,
  isActive: false,
};

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: {
    shark: { ...defaultStats },
    wolf: { ...defaultStats },
    grid: { ...defaultStats },
  },
  setAgentStats: (agentId, stats) => {
    const current = get().agents[agentId] ?? { ...defaultStats };
    set({
      agents: {
        ...get().agents,
        [agentId]: { ...current, ...stats },
      },
    });
  },
}));

// Selectors
export const selectTotalPnl = (state: AgentState): number => {
  const agents = state.agents;
  return Object.values(agents).reduce((sum, a) => {
    const unrealized = a.position?.unrealizedPnl ?? 0;
    return sum + unrealized;
  }, 0);
};

export const selectActiveCount = (state: AgentState): number => {
  return Object.values(state.agents).filter((a) => a.isActive).length;
};
