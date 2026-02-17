import { AgentConfig } from "../shared/types.js";

export const gridConfig: AgentConfig = {
  name: "Grid",
  budget: 1,
  loopIntervalMs: 15_000,
  maxLeverage: 2,
  stopLossPct: 0.08, // wider stop for grid
  takeProfitPct: 0.15,
  marketIndex: 0, // SOL-PERP
};

export const GRID_LEVELS = 10;
export const GRID_SPACING_PCT = 0.005; // 0.5%
export const SIZE_PER_LEVEL = 0.1; // SOL per grid level
