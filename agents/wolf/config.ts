import { AgentConfig } from "../shared/types.js";

export const wolfConfig: AgentConfig = {
  name: "Wolf",
  budget: 100,
  loopIntervalMs: 45_000,
  maxLeverage: 3,
  stopLossPct: 0.05, // Fallback if ATR unavailable (5%)
  takeProfitPct: 0.08, // Fallback if ATR unavailable (8%)
  marketIndex: 0, // SOL-PERP

  // Enhanced: ATR-based risk management
  // NOTE: ATR is underestimated (close-only data), so we use wider multipliers
  atrStopMultiplier: 3.0, // Wider stop to account for ATR underestimation
  atrTakeProfitMultiplier: 4.0, // TP at 4x ATR for better R:R

  // Enhanced: Adaptive parameters
  useAdaptiveParams: true, // Adapt BB width and RSI thresholds
  useRegimeFilter: true, // Only trade in mean-reverting/random regime

  // Enhanced: Kelly position sizing (based on estimated performance)
  winRate: 0.55, // Higher win rate for mean reversion
  avgWinLossRatio: 1.2, // Smaller wins but more frequent
};
