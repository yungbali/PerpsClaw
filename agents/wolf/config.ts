import { AgentConfig } from "../shared/types.js";

export const wolfConfig: AgentConfig = {
  name: "Wolf",
  budget: 1,
  loopIntervalMs: 45_000,
  maxLeverage: 3,
  stopLossPct: 0.03,
  takeProfitPct: 0.05,
  marketIndex: 0, // SOL-PERP
};
