/**
 * Market Regime Detection Module
 *
 * Implements multiple regime detection methods:
 * - Hurst Exponent based classification
 * - Volatility regime detection
 * - Simple HMM-inspired state machine
 * - Composite regime scoring
 */

import {
  hurstExponent,
  classifyRegime,
  MarketRegime,
  atr,
  realizedVolatility,
  adx,
  rsi,
  sma,
} from "./indicators.js";
import { logger } from "./logger.js";

// ============================================================================
// REGIME TYPES
// ============================================================================

export type VolatilityRegime = "low" | "medium" | "high" | "extreme";
export type TrendStrength = "none" | "weak" | "moderate" | "strong";

export interface RegimeState {
  /** Primary regime based on Hurst exponent */
  primaryRegime: MarketRegime;
  /** Volatility regime */
  volatilityRegime: VolatilityRegime;
  /** Trend strength from ADX */
  trendStrength: TrendStrength;
  /** Raw Hurst value */
  hurst: number;
  /** Current ATR percentage */
  atrPercent: number;
  /** ADX value */
  adxValue: number;
  /** Confidence in regime classification (0-1) */
  confidence: number;
  /** Recommended agents for this regime */
  recommendedAgents: string[];
  /** Risk adjustment factor (0.5 = half size, 1.0 = normal, 1.5 = larger) */
  riskAdjustment: number;
  /** Description of current regime */
  description: string;
}

// ============================================================================
// VOLATILITY REGIME DETECTION
// ============================================================================

/**
 * Classify volatility regime based on ATR percentile
 */
export function classifyVolatilityRegime(
  atrPercentile: number
): VolatilityRegime {
  if (atrPercentile >= 90) return "extreme";
  if (atrPercentile >= 70) return "high";
  if (atrPercentile >= 30) return "medium";
  return "low";
}

/**
 * Calculate ATR percentile for volatility regime
 */
export function calculateAtrPercentile(
  prices: number[],
  period: number = 14,
  lookback: number = 100
): number {
  if (prices.length < lookback + period) return 50;

  const currentAtr = atr(prices, period);
  const historicalAtrs: number[] = [];

  for (let i = period; i < Math.min(lookback, prices.length - period); i++) {
    const slice = prices.slice(0, prices.length - i);
    if (slice.length >= period + 1) {
      historicalAtrs.push(atr(slice, period));
    }
  }

  if (historicalAtrs.length === 0) return 50;

  const below = historicalAtrs.filter((v) => v < currentAtr).length;
  return (below / historicalAtrs.length) * 100;
}

// ============================================================================
// TREND STRENGTH DETECTION
// ============================================================================

/**
 * Classify trend strength based on ADX
 */
export function classifyTrendStrength(adxValue: number): TrendStrength {
  if (adxValue >= 40) return "strong";
  if (adxValue >= 25) return "moderate";
  if (adxValue >= 15) return "weak";
  return "none";
}

// ============================================================================
// SIMPLE STATE MACHINE (HMM-INSPIRED)
// ============================================================================

interface MarketState {
  returns: number;
  volatility: number;
  trend: number;
}

/**
 * Calculate market state features
 */
function calculateMarketState(prices: number[]): MarketState {
  if (prices.length < 20) {
    return { returns: 0, volatility: 0, trend: 0 };
  }

  // Recent returns (normalized)
  const shortReturn = (prices[prices.length - 1] - prices[prices.length - 5]) / prices[prices.length - 5];
  const medReturn = (prices[prices.length - 1] - prices[prices.length - 20]) / prices[prices.length - 20];

  // Volatility
  const vol = realizedVolatility(prices, 10);

  // Trend (SMA slope)
  const sma20 = sma(prices, 20);
  const prevSma20 = sma(prices.slice(0, -1), 20);
  const trend = prevSma20 > 0 ? (sma20 - prevSma20) / prevSma20 : 0;

  return {
    returns: (shortReturn + medReturn) / 2,
    volatility: vol,
    trend: trend,
  };
}

/**
 * State-based regime classification (simplified HMM)
 */
export function stateBasedRegime(prices: number[]): {
  regime: "bull" | "bear" | "neutral";
  confidence: number;
} {
  const state = calculateMarketState(prices);

  // Bull market: positive returns, positive trend
  if (state.returns > 0.02 && state.trend > 0) {
    const confidence = Math.min(1, Math.abs(state.returns) * 10 + Math.abs(state.trend) * 50);
    return { regime: "bull", confidence };
  }

  // Bear market: negative returns, negative trend
  if (state.returns < -0.02 && state.trend < 0) {
    const confidence = Math.min(1, Math.abs(state.returns) * 10 + Math.abs(state.trend) * 50);
    return { regime: "bear", confidence };
  }

  // Neutral/ranging
  return {
    regime: "neutral",
    confidence: 1 - Math.abs(state.returns) * 5,
  };
}

// ============================================================================
// COMPOSITE REGIME DETECTION
// ============================================================================

/**
 * Detect market regime using multiple methods
 *
 * @param prices - Price history (100+ prices recommended)
 * @returns Complete regime state with recommendations
 */
export function detectRegime(prices: number[]): RegimeState {
  // Calculate all indicators
  const hurst = hurstExponent(prices);
  const primaryRegime = classifyRegime(hurst);

  const currentAtr = atr(prices, 14);
  const currentPrice = prices[prices.length - 1];
  const atrPct = currentPrice > 0 ? (currentAtr / currentPrice) * 100 : 0;
  const atrPercentile = calculateAtrPercentile(prices);

  const volatilityRegime = classifyVolatilityRegime(atrPercentile);
  const adxValue = adx(prices, 14);
  const trendStrength = classifyTrendStrength(adxValue);
  const { regime: stateRegime, confidence: stateConfidence } = stateBasedRegime(prices);

  // Calculate composite confidence
  let confidence = 0.5;
  if (hurst > 0.6 || hurst < 0.4) confidence += 0.2;
  if (adxValue > 25 || adxValue < 15) confidence += 0.15;
  confidence += stateConfidence * 0.15;
  confidence = Math.min(1, confidence);

  // Determine recommended agents based on regime
  const recommendedAgents = getRecommendedAgents(
    primaryRegime,
    volatilityRegime,
    trendStrength
  );

  // Calculate risk adjustment
  const riskAdjustment = calculateRiskAdjustment(
    volatilityRegime,
    trendStrength,
    primaryRegime
  );

  // Generate description
  const description = generateRegimeDescription(
    primaryRegime,
    volatilityRegime,
    trendStrength,
    stateRegime
  );

  return {
    primaryRegime,
    volatilityRegime,
    trendStrength,
    hurst,
    atrPercent: atrPct,
    adxValue,
    confidence,
    recommendedAgents,
    riskAdjustment,
    description,
  };
}

/**
 * Determine which agents should be active based on regime
 */
function getRecommendedAgents(
  regime: MarketRegime,
  volRegime: VolatilityRegime,
  trend: TrendStrength
): string[] {
  const agents: string[] = [];

  // Trending regime -> Shark (momentum)
  if (regime === "trending" && trend !== "none") {
    agents.push("shark");
  }

  // Mean reverting regime -> Wolf (mean reversion)
  if (regime === "mean_reverting") {
    agents.push("wolf");
  }

  // Low/medium volatility and ranging -> Grid
  if ((volRegime === "low" || volRegime === "medium") && regime === "random") {
    agents.push("grid");
  }

  // Random with moderate trend -> Both Shark and Wolf can work
  if (regime === "random" && trend === "moderate") {
    agents.push("shark");
    agents.push("wolf");
  }

  // Extreme volatility -> Be cautious, reduce activity
  if (volRegime === "extreme") {
    // Only keep agents with tighter stops
    return agents.filter((a) => a === "wolf");
  }

  // High volatility trending -> Shark with reduced size
  if (volRegime === "high" && regime === "trending") {
    if (!agents.includes("shark")) agents.push("shark");
  }

  // Default: if no specific recommendation, allow all with caution
  if (agents.length === 0) {
    agents.push("wolf"); // Wolf is most conservative
  }

  return agents;
}

/**
 * Calculate risk adjustment factor based on regime
 */
function calculateRiskAdjustment(
  volRegime: VolatilityRegime,
  trend: TrendStrength,
  regime: MarketRegime
): number {
  let adjustment = 1.0;

  // Volatility adjustments
  switch (volRegime) {
    case "extreme":
      adjustment *= 0.25; // Very cautious
      break;
    case "high":
      adjustment *= 0.5;
      break;
    case "medium":
      adjustment *= 0.8;
      break;
    case "low":
      adjustment *= 1.0;
      break;
  }

  // Trend adjustments
  switch (trend) {
    case "strong":
      adjustment *= 1.2; // Slightly larger in strong trends
      break;
    case "none":
      adjustment *= 0.7; // Cautious when no clear trend
      break;
  }

  // Regime adjustments
  if (regime === "random") {
    adjustment *= 0.8; // Reduce in random walk markets
  }

  return Math.max(0.2, Math.min(1.5, adjustment));
}

/**
 * Generate human-readable regime description
 */
function generateRegimeDescription(
  regime: MarketRegime,
  volRegime: VolatilityRegime,
  trend: TrendStrength,
  stateRegime: "bull" | "bear" | "neutral"
): string {
  const parts: string[] = [];

  // Market direction
  if (stateRegime === "bull") {
    parts.push("Bullish market");
  } else if (stateRegime === "bear") {
    parts.push("Bearish market");
  } else {
    parts.push("Neutral/ranging market");
  }

  // Regime type
  if (regime === "trending") {
    parts.push("with persistent trends");
  } else if (regime === "mean_reverting") {
    parts.push("with mean-reverting behavior");
  } else {
    parts.push("with random walk characteristics");
  }

  // Volatility
  parts.push(`(${volRegime} volatility)`);

  // Trend strength
  if (trend !== "none") {
    parts.push(`- ${trend} trend strength`);
  }

  return parts.join(" ");
}

// ============================================================================
// REGIME CHANGE DETECTION
// ============================================================================

let previousRegime: MarketRegime | null = null;
let regimeChangeCount = 0;

/**
 * Check if regime has changed since last check
 */
export function checkRegimeChange(prices: number[]): {
  changed: boolean;
  from: MarketRegime | null;
  to: MarketRegime;
  changeCount: number;
} {
  const currentRegime = classifyRegime(hurstExponent(prices));
  const changed = previousRegime !== null && previousRegime !== currentRegime;

  if (changed) {
    regimeChangeCount++;
    logger.info(
      `Regime change detected: ${previousRegime} -> ${currentRegime} (change #${regimeChangeCount})`
    );
  }

  const result = {
    changed,
    from: previousRegime,
    to: currentRegime,
    changeCount: regimeChangeCount,
  };

  previousRegime = currentRegime;
  return result;
}

/**
 * Reset regime tracking (for testing or new sessions)
 */
export function resetRegimeTracking(): void {
  previousRegime = null;
  regimeChangeCount = 0;
}

// ============================================================================
// AGENT SELECTION HELPER
// ============================================================================

/**
 * Determine if a specific agent should trade in current regime
 */
export function shouldAgentTrade(
  agentName: string,
  regimeState: RegimeState
): { shouldTrade: boolean; reason: string; sizeMultiplier: number } {
  const isRecommended = regimeState.recommendedAgents.includes(
    agentName.toLowerCase()
  );

  if (!isRecommended) {
    return {
      shouldTrade: false,
      reason: `${agentName} not recommended in ${regimeState.primaryRegime} regime with ${regimeState.volatilityRegime} volatility`,
      sizeMultiplier: 0,
    };
  }

  // Calculate size multiplier based on regime confidence and risk adjustment
  const sizeMultiplier =
    regimeState.riskAdjustment *
    (0.5 + regimeState.confidence * 0.5);

  return {
    shouldTrade: true,
    reason: regimeState.description,
    sizeMultiplier: Math.max(0.1, Math.min(1.5, sizeMultiplier)),
  };
}
