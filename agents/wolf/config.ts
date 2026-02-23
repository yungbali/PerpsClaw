import { AgentConfig } from "../shared/types.js";

export const wolfConfig: AgentConfig = {
  name: "Wolf",
  budget: 100,
  loopIntervalMs: 45_000,
  maxLeverage: 3,
  stopLossPct: 0.03, // Fallback if ATR unavailable
  takeProfitPct: 0.05, // Fallback if ATR unavailable
  marketIndex: 0, // SOL-PERP

  // Enhanced: ATR-based risk management (tighter for mean reversion)
  atrStopMultiplier: 1.5, // Tighter stop at 1.5x ATR
  atrTakeProfitMultiplier: 2.0, // TP at 2x ATR (mean reversion has smaller targets)

  // Enhanced: Adaptive parameters
  useAdaptiveParams: true, // Adapt BB width and RSI thresholds
  useRegimeFilter: true, // Only trade in mean-reverting/random regime

  // Enhanced: Kelly position sizing (based on estimated performance)
  winRate: 0.55, // Higher win rate for mean reversion
  avgWinLossRatio: 1.2, // Smaller wins but more frequent
};
