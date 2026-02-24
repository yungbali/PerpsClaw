import { AgentConfig } from "../shared/types.js";

export const gridConfig: AgentConfig = {
  name: "Grid",
  budget: 100,
  loopIntervalMs: 15_000,
  maxLeverage: 2,
  stopLossPct: 0.10, // Fallback if ATR unavailable (10%)
  takeProfitPct: 0.18, // Fallback if ATR unavailable (18%)
  marketId: "btc", // Trade BTC-PERP
  marketIndex: 1, // BTC-PERP index (legacy)

  // Enhanced: ATR-based risk management (wider for grid to capture swings)
  // NOTE: ATR is underestimated (close-only data), so we use wider multipliers
  atrStopMultiplier: 5.0, // Much wider stop to allow grid to work + ATR correction
  atrTakeProfitMultiplier: 8.0, // Larger TP target for grid swings

  // Enhanced: Adaptive parameters
  useAdaptiveParams: true, // ATR-based grid spacing
  useRegimeFilter: true, // Pause in strong trending regime

  // Enhanced: Kelly position sizing
  winRate: 0.60, // Grid has high win rate in ranging markets
  avgWinLossRatio: 0.8, // Smaller wins but very frequent
};

// Legacy constants (now dynamically calculated based on ATR)
export const GRID_LEVELS = 10; // Base level count, adjusted by volatility
export const GRID_SPACING_PCT = 0.005; // 0.5% base, adjusted by ATR
export const SIZE_PER_LEVEL = 0.1; // SOL per grid level base
