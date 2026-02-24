import { AgentConfig, TradeSignal, StrategyContext } from "./types.js";
import { logger } from "./logger.js";
import {
  atr,
  atrStopDistance,
  atrTakeProfitDistance,
  kellyFraction,
  kellyPositionSize,
} from "./indicators.js";

// ============================================================================
// TRAILING STOP STATE
// ============================================================================

interface TrailingStopState {
  highWaterMark: number;
  lowWaterMark: number;
  trailingStopPrice: number;
  isActive: boolean;
}

const trailingStops: Map<string, TrailingStopState> = new Map();

/**
 * Initialize or update trailing stop for an agent.
 * Uses same minimum stop floor as ATR stops for consistency.
 */
export function updateTrailingStop(
  agentName: string,
  currentPrice: number,
  positionSize: number,
  atrValue: number,
  multiplier: number = 3.0 // Increased from 1.5 to match wider stops
): TrailingStopState {
  let state = trailingStops.get(agentName);

  if (!state || positionSize === 0) {
    // Initialize new state
    state = {
      highWaterMark: currentPrice,
      lowWaterMark: currentPrice,
      trailingStopPrice: 0,
      isActive: positionSize !== 0,
    };
  }

  // Calculate trailing distance with minimum floor
  const atrDistance = atrValue * multiplier;
  const minDistance = currentPrice * MIN_STOP_PERCENT;
  const trailDistance = Math.max(atrDistance, minDistance);

  if (positionSize > 0) {
    // Long position: track high water mark
    if (currentPrice > state.highWaterMark) {
      state.highWaterMark = currentPrice;
      state.trailingStopPrice = currentPrice - trailDistance;
    }
  } else if (positionSize < 0) {
    // Short position: track low water mark
    if (currentPrice < state.lowWaterMark) {
      state.lowWaterMark = currentPrice;
      state.trailingStopPrice = currentPrice + trailDistance;
    }
  }

  trailingStops.set(agentName, state);
  return state;
}

/**
 * Check if trailing stop is hit
 */
export function checkTrailingStop(
  agentName: string,
  currentPrice: number,
  positionSize: number
): boolean {
  const state = trailingStops.get(agentName);
  if (!state || !state.isActive || state.trailingStopPrice === 0) {
    return false;
  }

  if (positionSize > 0 && currentPrice <= state.trailingStopPrice) {
    return true; // Long position hit trailing stop
  }
  if (positionSize < 0 && currentPrice >= state.trailingStopPrice) {
    return true; // Short position hit trailing stop
  }

  return false;
}

/**
 * Reset trailing stop (call when position is closed)
 */
export function resetTrailingStop(agentName: string): void {
  trailingStops.delete(agentName);
}

// ============================================================================
// ATR-BASED RISK CHECKS
// ============================================================================

/**
 * Minimum stop distance as percentage of entry price.
 * This protects against underestimated ATR (close-only data lacks high/low wicks).
 * 3% minimum ensures stops aren't triggered by normal market noise.
 */
const MIN_STOP_PERCENT = 0.03;

/**
 * Calculate ATR-based stop loss price with minimum floor protection
 */
export function calculateAtrStopPrice(
  entryPrice: number,
  positionSize: number,
  atrValue: number,
  multiplier: number = 2.0
): number {
  const atrStopDistance = atrValue * multiplier;
  const minStopDistance = entryPrice * MIN_STOP_PERCENT;

  // Use the larger of ATR-based or minimum stop distance
  const stopDistance = Math.max(atrStopDistance, minStopDistance);

  if (positionSize > 0) {
    return entryPrice - stopDistance; // Long: stop below entry
  } else if (positionSize < 0) {
    return entryPrice + stopDistance; // Short: stop above entry
  }
  return 0;
}

/**
 * Calculate ATR-based take profit price
 */
export function calculateAtrTakeProfitPrice(
  entryPrice: number,
  positionSize: number,
  atrValue: number,
  multiplier: number = 3.0
): number {
  const tpDistance = atrValue * multiplier;

  if (positionSize > 0) {
    return entryPrice + tpDistance; // Long: TP above entry
  } else if (positionSize < 0) {
    return entryPrice - tpDistance; // Short: TP below entry
  }
  return 0;
}

/**
 * Check if ATR-based stop loss is hit
 */
export function isAtrStopHit(
  currentPrice: number,
  entryPrice: number,
  positionSize: number,
  atrValue: number,
  multiplier: number = 2.0
): boolean {
  const stopPrice = calculateAtrStopPrice(
    entryPrice,
    positionSize,
    atrValue,
    multiplier
  );

  if (positionSize > 0 && currentPrice <= stopPrice) {
    return true;
  }
  if (positionSize < 0 && currentPrice >= stopPrice) {
    return true;
  }
  return false;
}

/**
 * Check if ATR-based take profit is hit
 */
export function isAtrTakeProfitHit(
  currentPrice: number,
  entryPrice: number,
  positionSize: number,
  atrValue: number,
  multiplier: number = 3.0
): boolean {
  const tpPrice = calculateAtrTakeProfitPrice(
    entryPrice,
    positionSize,
    atrValue,
    multiplier
  );

  if (positionSize > 0 && currentPrice >= tpPrice) {
    return true;
  }
  if (positionSize < 0 && currentPrice <= tpPrice) {
    return true;
  }
  return false;
}

// ============================================================================
// KELLY POSITION SIZING
// ============================================================================

/**
 * Calculate optimal position size using Kelly criterion
 *
 * @param config - Agent configuration
 * @param ctx - Strategy context
 * @returns Optimal position size in base asset (SOL)
 */
export function calculateKellySize(
  config: AgentConfig,
  ctx: StrategyContext
): number {
  const winRate = config.winRate ?? 0.5;
  const avgWinLossRatio = config.avgWinLossRatio ?? 1.5;
  const volatility = ctx.atrPercent ?? 1;
  const avgVolatility = ctx.avgAtr
    ? (ctx.avgAtr / ctx.currentPrice) * 100
    : volatility;

  const kelly = kellyPositionSize(
    config.budget,
    ctx.currentPrice,
    winRate,
    avgWinLossRatio,
    volatility,
    avgVolatility
  );

  // Apply leverage constraint
  const maxNotional = config.budget * config.maxLeverage;
  const maxSize = maxNotional / ctx.currentPrice;

  return Math.min(kelly, maxSize);
}

/**
 * Get Kelly fraction for display/logging
 */
export function getKellyFractionInfo(config: AgentConfig): {
  fraction: number;
  description: string;
} {
  const winRate = config.winRate ?? 0.5;
  const avgWinLossRatio = config.avgWinLossRatio ?? 1.5;
  const kelly = kellyFraction(winRate, avgWinLossRatio, 0.5);

  return {
    fraction: kelly,
    description: `Half-Kelly: ${(kelly * 100).toFixed(1)}% of capital per trade (WR: ${(winRate * 100).toFixed(0)}%, W/L: ${avgWinLossRatio.toFixed(2)})`,
  };
}

// ============================================================================
// ENHANCED RISK CHECKS
// ============================================================================

/**
 * Enforce position sizing and stop-loss/take-profit checks.
 * Returns the signal unchanged if within limits, or overrides to "close"/"none".
 *
 * Enhanced with:
 * - ATR-based stops (when atr is provided in context)
 * - Trailing stops
 * - Kelly position sizing
 * - Market data adjustments
 */
export function applyRiskChecks(
  signal: TradeSignal,
  ctx: StrategyContext,
  config: AgentConfig
): TradeSignal {
  const useAtrStops = ctx.atr !== undefined && ctx.atr > 0;
  const atrValue = ctx.atr ?? 0;
  const atrStopMult = config.atrStopMultiplier ?? 2.0;
  const atrTpMult = config.atrTakeProfitMultiplier ?? 3.0;

  // Check trailing stop first (most responsive)
  // Use config's stop multiplier for consistency (not hardcoded)
  if (ctx.positionSize !== 0 && useAtrStops) {
    updateTrailingStop(
      config.name,
      ctx.currentPrice,
      ctx.positionSize,
      atrValue,
      atrStopMult // Use config multiplier instead of hardcoded 1.5
    );

    if (checkTrailingStop(config.name, ctx.currentPrice, ctx.positionSize)) {
      logger.warn(`Trailing stop triggered for ${config.name}`);
      resetTrailingStop(config.name);
      return {
        direction: "close",
        size: Math.abs(ctx.positionSize),
        confidence: 1,
        reason: `Trailing stop hit at ${ctx.currentPrice.toFixed(2)}`,
      };
    }
  }

  // Check ATR-based stop loss
  if (ctx.positionSize !== 0 && ctx.entryPrice > 0 && useAtrStops) {
    if (
      isAtrStopHit(
        ctx.currentPrice,
        ctx.entryPrice,
        ctx.positionSize,
        atrValue,
        atrStopMult
      )
    ) {
      const stopPrice = calculateAtrStopPrice(
        ctx.entryPrice,
        ctx.positionSize,
        atrValue,
        atrStopMult
      );
      logger.warn(
        `ATR stop-loss triggered: entry=${ctx.entryPrice.toFixed(2)}, stop=${stopPrice.toFixed(2)}, current=${ctx.currentPrice.toFixed(2)}`
      );
      resetTrailingStop(config.name);
      return {
        direction: "close",
        size: Math.abs(ctx.positionSize),
        confidence: 1,
        reason: `ATR stop-loss at ${stopPrice.toFixed(2)} (${atrStopMult}x ATR)`,
      };
    }

    // Check ATR-based take profit
    if (
      isAtrTakeProfitHit(
        ctx.currentPrice,
        ctx.entryPrice,
        ctx.positionSize,
        atrValue,
        atrTpMult
      )
    ) {
      const tpPrice = calculateAtrTakeProfitPrice(
        ctx.entryPrice,
        ctx.positionSize,
        atrValue,
        atrTpMult
      );
      logger.info(
        `ATR take-profit triggered: entry=${ctx.entryPrice.toFixed(2)}, TP=${tpPrice.toFixed(2)}, current=${ctx.currentPrice.toFixed(2)}`
      );
      resetTrailingStop(config.name);
      return {
        direction: "close",
        size: Math.abs(ctx.positionSize),
        confidence: 1,
        reason: `ATR take-profit at ${tpPrice.toFixed(2)} (${atrTpMult}x ATR)`,
      };
    }
  }

  // Fallback: percentage-based stop-loss/take-profit
  if (ctx.positionSize !== 0 && ctx.entryPrice > 0 && !useAtrStops) {
    const pnlPct =
      ctx.unrealizedPnl / (ctx.entryPrice * Math.abs(ctx.positionSize));

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

  // Calculate position size
  let targetSize = signal.size;

  // Use Kelly sizing if configured
  if (config.winRate !== undefined && config.avgWinLossRatio !== undefined) {
    const kellySize = calculateKellySize(config, ctx);
    targetSize = Math.min(signal.size, kellySize);
    if (targetSize < signal.size) {
      logger.debug(
        `Kelly sizing: ${signal.size.toFixed(4)} -> ${targetSize.toFixed(4)} SOL`
      );
    }
  }

  // Apply market data adjustments
  if (ctx.marketData) {
    targetSize *= ctx.marketData.positionMultiplier;
    if (ctx.marketData.positionMultiplier < 1) {
      logger.debug(
        `Market data adjustment: ${ctx.marketData.liquidationRisk.riskCategory} risk, size * ${ctx.marketData.positionMultiplier.toFixed(2)}`
      );
    }
  }

  // Apply regime adjustments
  if (ctx.regimeState) {
    targetSize *= ctx.regimeState.riskAdjustment;
    if (ctx.regimeState.riskAdjustment < 1) {
      logger.debug(
        `Regime adjustment: ${ctx.regimeState.primaryRegime}/${ctx.regimeState.volatilityRegime}, size * ${ctx.regimeState.riskAdjustment.toFixed(2)}`
      );
    }
  }

  // Enforce max position size based on budget and leverage
  const maxNotional = config.budget * config.maxLeverage;
  const maxSize = maxNotional / ctx.currentPrice;
  const clampedSize = Math.min(targetSize, maxSize);

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

  // Minimum position size check
  if (clampedSize < 0.01) {
    logger.debug("Position size too small after adjustments, skipping");
    return {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "Position too small after risk adjustments",
    };
  }

  return { ...signal, size: clampedSize };
}

// ============================================================================
// RISK METRICS
// ============================================================================

export interface RiskMetrics {
  /** Current ATR-based stop price */
  stopPrice: number;
  /** Current ATR-based take profit price */
  takeProfitPrice: number;
  /** Current trailing stop price */
  trailingStopPrice: number;
  /** Risk per trade as % of account */
  riskPercent: number;
  /** Potential reward as % of account */
  rewardPercent: number;
  /** Risk/Reward ratio */
  riskRewardRatio: number;
}

/**
 * Calculate current risk metrics for display
 */
export function calculateRiskMetrics(
  config: AgentConfig,
  ctx: StrategyContext
): RiskMetrics | null {
  if (ctx.positionSize === 0 || ctx.entryPrice === 0) {
    return null;
  }

  const atrValue = ctx.atr ?? ctx.currentPrice * 0.02; // Fallback to 2%
  const atrStopMult = config.atrStopMultiplier ?? 2.0;
  const atrTpMult = config.atrTakeProfitMultiplier ?? 3.0;

  const stopPrice = calculateAtrStopPrice(
    ctx.entryPrice,
    ctx.positionSize,
    atrValue,
    atrStopMult
  );

  const takeProfitPrice = calculateAtrTakeProfitPrice(
    ctx.entryPrice,
    ctx.positionSize,
    atrValue,
    atrTpMult
  );

  const trailingState = trailingStops.get(config.name);
  const trailingStopPrice = trailingState?.trailingStopPrice ?? 0;

  // Calculate risk/reward
  const positionValue = Math.abs(ctx.positionSize) * ctx.entryPrice;
  const riskAmount = Math.abs(ctx.entryPrice - stopPrice) * Math.abs(ctx.positionSize);
  const rewardAmount = Math.abs(takeProfitPrice - ctx.entryPrice) * Math.abs(ctx.positionSize);

  const riskPercent = (riskAmount / config.budget) * 100;
  const rewardPercent = (rewardAmount / config.budget) * 100;
  const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  return {
    stopPrice,
    takeProfitPrice,
    trailingStopPrice,
    riskPercent,
    rewardPercent,
    riskRewardRatio,
  };
}
