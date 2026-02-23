import { AgentConfig } from "../shared/types.js";

export const sharkConfig: AgentConfig = {
  name: "Shark",
  budget: 100,
  loopIntervalMs: 30_000,
  maxLeverage: 5,
  stopLossPct: 0.05, // Fallback if ATR unavailable
  takeProfitPct: 0.10, // Fallback if ATR unavailable
  marketIndex: 0, // SOL-PERP

  // Enhanced: ATR-based risk management
  atrStopMultiplier: 2.0, // Stop at 2x ATR from entry
  atrTakeProfitMultiplier: 3.0, // TP at 3x ATR from entry

  // Enhanced: Adaptive parameters
  useAdaptiveParams: true, // Scale indicators with volatility
  useRegimeFilter: true, // Only trade in trending regime

  // Enhanced: Kelly position sizing (based on estimated performance)
  winRate: 0.48, // Conservative estimate for momentum strategy
  avgWinLossRatio: 2.0, // Target 2:1 reward/risk
};
