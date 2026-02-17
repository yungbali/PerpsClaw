import { AgentConfig, TradeSignal, StrategyContext } from "./types.js";
import { logger } from "./logger.js";

/**
 * Enforce position sizing and stop-loss/take-profit checks.
 * Returns the signal unchanged if within limits, or overrides to "close"/"none".
 */
export function applyRiskChecks(
  signal: TradeSignal,
  ctx: StrategyContext,
  config: AgentConfig
): TradeSignal {
  // Check stop-loss
  if (ctx.positionSize !== 0 && ctx.entryPrice > 0) {
    const pnlPct = ctx.unrealizedPnl / (ctx.entryPrice * Math.abs(ctx.positionSize));

    if (pnlPct <= -config.stopLossPct) {
      logger.warn(`Stop-loss triggered: ${(pnlPct * 100).toFixed(2)}%`);
      return {
        direction: "close",
        size: Math.abs(ctx.positionSize),
        confidence: 1,
        reason: `Stop-loss at ${(pnlPct * 100).toFixed(2)}%`,
      };
    }

    if (pnlPct >= config.takeProfitPct) {
      logger.warn(`Take-profit triggered: ${(pnlPct * 100).toFixed(2)}%`);
      return {
        direction: "close",
        size: Math.abs(ctx.positionSize),
        confidence: 1,
        reason: `Take-profit at ${(pnlPct * 100).toFixed(2)}%`,
      };
    }
  }

  // If signal is none or close, pass through
  if (signal.direction === "none" || signal.direction === "close") {
    return signal;
  }

  // Enforce max position size based on budget and leverage
  const maxNotional = config.budget * config.maxLeverage;
  const maxSize = maxNotional / ctx.currentPrice;
  const clampedSize = Math.min(signal.size, maxSize);

  if (clampedSize < signal.size) {
    logger.info(
      `Position clamped: ${signal.size.toFixed(4)} -> ${clampedSize.toFixed(4)} SOL`
    );
  }

  // Don't open if we don't have collateral
  if (ctx.availableCollateral <= 0.01) {
    logger.warn("Insufficient collateral, skipping trade");
    return { direction: "none", size: 0, confidence: 0, reason: "No collateral" };
  }

  return { ...signal, size: clampedSize };
}
