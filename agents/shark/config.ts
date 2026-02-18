import { AgentConfig } from "../shared/types.js";

export const sharkConfig: AgentConfig = {
  name: "Shark",
  budget: 100,
  loopIntervalMs: 30_000,
  maxLeverage: 5,
  stopLossPct: 0.05,
  takeProfitPct: 0.10,
  marketIndex: 0, // SOL-PERP
};
