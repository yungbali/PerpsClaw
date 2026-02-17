export interface AgentInfo {
  id: string;
  name: string;
  strategy: string;
  color: string;
  wallet: string;
}

export const AGENTS: AgentInfo[] = [
  {
    id: "shark",
    name: "Shark",
    strategy: "Momentum (SMA Crossover)",
    color: "#ff6b35",
    wallet: process.env.NEXT_PUBLIC_SHARK_WALLET || "",
  },
  {
    id: "wolf",
    name: "Wolf",
    strategy: "Mean Reversion (BB + RSI)",
    color: "#8b5cf6",
    wallet: process.env.NEXT_PUBLIC_WOLF_WALLET || "",
  },
  {
    id: "grid",
    name: "Grid",
    strategy: "Grid Trading",
    color: "#06b6d4",
    wallet: process.env.NEXT_PUBLIC_GRID_WALLET || "",
  },
];
