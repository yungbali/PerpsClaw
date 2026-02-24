/**
 * Adaptive Technical Indicators Module
 *
 * Contains advanced indicators for dynamic parameter adjustment:
 * - ATR (Average True Range) for volatility-based stops
 * - Hurst Exponent for regime detection
 * - RSI, SMA, Bollinger Bands with adaptive parameters
 * - Kelly Criterion for position sizing
 */

import type { OHLCCandle } from "./types.js";

// ============================================================================
// CORE INDICATOR FUNCTIONS
// ============================================================================

/**
 * Simple Moving Average
 */
export function sma(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Exponential Moving Average
 */
export function ema(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const multiplier = 2 / (period + 1);
  let emaValue = sma(prices.slice(0, period), period);

  for (let i = period; i < prices.length; i++) {
    emaValue = (prices[i] - emaValue) * multiplier + emaValue;
  }
  return emaValue;
}

/**
 * Standard Deviation
 */
export function stdDev(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

/**
 * Relative Strength Index
 */
export function rsi(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes: number[] = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (const change of changes) {
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ============================================================================
// AVERAGE TRUE RANGE (ATR)
// ============================================================================

/**
 * Calculate True Range from OHLC candle data (accurate method).
 * TR = max(high - low, abs(high - prevClose), abs(low - prevClose))
 */
export function trueRangeOHLC(candle: OHLCCandle, prevClose: number): number {
  const highLow = candle.high - candle.low;
  const highPrevClose = Math.abs(candle.high - prevClose);
  const lowPrevClose = Math.abs(candle.low - prevClose);

  return Math.max(highLow, highPrevClose, lowPrevClose);
}

/**
 * True Range for close-only data (legacy approximation).
 * Uses 2x multiplier to better estimate actual range from close-to-close changes.
 * This is a fallback when OHLC data is unavailable.
 */
export function trueRange(prices: number[], index: number): number {
  if (index < 1) return 0;

  const current = prices[index];
  const prev = prices[index - 1];

  // Estimate high/low from price movement (approximation for close-only data)
  // Increased from 1.5x to 2.0x to better approximate actual True Range
  const priceChange = Math.abs(current - prev);
  const estimatedRange = priceChange * 2.0;

  return Math.max(priceChange, estimatedRange);
}

/**
 * Average True Range using OHLC candle data (accurate method).
 * Use this when OHLC data is available for proper volatility measurement.
 *
 * @param candles - Array of OHLC candles
 * @param period - ATR period (default 14)
 * @returns ATR value
 */
export function atrOHLC(candles: OHLCCandle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;

  // Calculate true ranges from OHLC data
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = trueRangeOHLC(candles[i], candles[i - 1].close);
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) return 0;

  // Simple moving average of true ranges for initial ATR
  let atrValue = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Smooth using Wilder's method
  for (let i = period; i < trueRanges.length; i++) {
    atrValue = (atrValue * (period - 1) + trueRanges[i]) / period;
  }

  return atrValue;
}

/**
 * Average True Range (ATR) from close prices only (legacy/fallback method).
 * Measures market volatility using approximated True Range.
 *
 * @param prices - Array of closing prices
 * @param period - ATR period (default 14)
 * @returns ATR value
 */
export function atr(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 0;

  // Calculate true ranges using approximation
  const trueRanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const tr = trueRange(prices, i);
    trueRanges.push(tr);
  }

  // Simple moving average of true ranges for initial ATR
  if (trueRanges.length < period) return 0;

  let atrValue = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Smooth using Wilder's method
  for (let i = period; i < trueRanges.length; i++) {
    atrValue = (atrValue * (period - 1) + trueRanges[i]) / period;
  }

  return atrValue;
}

/**
 * ATR as percentage of current price (OHLC version).
 */
export function atrPercentOHLC(candles: OHLCCandle[], period: number = 14): number {
  if (candles.length === 0) return 0;
  const currentPrice = candles[candles.length - 1].close;
  if (currentPrice === 0) return 0;
  return (atrOHLC(candles, period) / currentPrice) * 100;
}

/**
 * ATR as percentage of current price (close-only fallback).
 */
export function atrPercent(prices: number[], period: number = 14): number {
  const currentPrice = prices[prices.length - 1];
  if (currentPrice === 0) return 0;
  return (atr(prices, period) / currentPrice) * 100;
}

/**
 * Calculate ATR-based stop loss distance (OHLC version).
 */
export function atrStopDistanceOHLC(
  candles: OHLCCandle[],
  multiplier: number = 2.0,
  period: number = 14
): number {
  return atrOHLC(candles, period) * multiplier;
}

/**
 * Calculate ATR-based stop loss distance (close-only fallback).
 *
 * @param prices - Price history
 * @param multiplier - ATR multiplier (default 2.0)
 * @param period - ATR period (default 14)
 * @returns Stop distance in price units
 */
export function atrStopDistance(
  prices: number[],
  multiplier: number = 2.0,
  period: number = 14
): number {
  return atr(prices, period) * multiplier;
}

/**
 * Calculate ATR-based take profit distance
 *
 * @param prices - Price history
 * @param multiplier - ATR multiplier (default 3.0)
 * @param period - ATR period (default 14)
 * @returns Take profit distance in price units
 */
export function atrTakeProfitDistance(
  prices: number[],
  multiplier: number = 3.0,
  period: number = 14
): number {
  return atr(prices, period) * multiplier;
}

// ============================================================================
// HURST EXPONENT
// ============================================================================

/**
 * Calculate Hurst Exponent using Rescaled Range (R/S) Analysis
 *
 * H > 0.5: Trending/persistent (use momentum strategies)
 * H = 0.5: Random walk (reduce trading or use grid)
 * H < 0.5: Mean reverting/anti-persistent (use mean reversion strategies)
 *
 * @param prices - Array of prices (minimum 100 recommended)
 * @param minWindow - Minimum window size for R/S calculation
 * @param maxWindow - Maximum window size
 * @returns Hurst exponent (0-1)
 */
export function hurstExponent(
  prices: number[],
  minWindow: number = 10,
  maxWindow?: number
): number {
  if (prices.length < minWindow * 2) return 0.5; // Not enough data, assume random

  const n = prices.length;
  maxWindow = maxWindow || Math.floor(n / 2);

  // Calculate returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  const logN: number[] = [];
  const logRS: number[] = [];

  // Calculate R/S for different window sizes
  for (let windowSize = minWindow; windowSize <= maxWindow; windowSize = Math.floor(windowSize * 1.5)) {
    const rsValues: number[] = [];

    // Divide series into non-overlapping windows
    const numWindows = Math.floor(returns.length / windowSize);

    for (let w = 0; w < numWindows; w++) {
      const windowStart = w * windowSize;
      const windowData = returns.slice(windowStart, windowStart + windowSize);

      // Mean of window
      const mean = windowData.reduce((a, b) => a + b, 0) / windowSize;

      // Cumulative deviation from mean
      let cumDev = 0;
      let maxCumDev = -Infinity;
      let minCumDev = Infinity;

      for (const val of windowData) {
        cumDev += val - mean;
        maxCumDev = Math.max(maxCumDev, cumDev);
        minCumDev = Math.min(minCumDev, cumDev);
      }

      // Range
      const range = maxCumDev - minCumDev;

      // Standard deviation
      const variance = windowData.reduce((sum, val) => sum + (val - mean) ** 2, 0) / windowSize;
      const stdDevVal = Math.sqrt(variance);

      // R/S ratio
      if (stdDevVal > 0) {
        rsValues.push(range / stdDevVal);
      }
    }

    if (rsValues.length > 0) {
      const avgRS = rsValues.reduce((a, b) => a + b, 0) / rsValues.length;
      logN.push(Math.log(windowSize));
      logRS.push(Math.log(avgRS));
    }
  }

  // Linear regression to find Hurst exponent (slope of log(R/S) vs log(n))
  if (logN.length < 2) return 0.5;

  const meanLogN = logN.reduce((a, b) => a + b, 0) / logN.length;
  const meanLogRS = logRS.reduce((a, b) => a + b, 0) / logRS.length;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < logN.length; i++) {
    numerator += (logN[i] - meanLogN) * (logRS[i] - meanLogRS);
    denominator += (logN[i] - meanLogN) ** 2;
  }

  if (denominator === 0) return 0.5;

  const hurst = numerator / denominator;

  // Clamp to valid range [0, 1]
  return Math.max(0, Math.min(1, hurst));
}

/**
 * Classify market regime based on Hurst exponent
 */
export type MarketRegime = "trending" | "mean_reverting" | "random";

export function classifyRegime(hurst: number): MarketRegime {
  if (hurst > 0.55) return "trending";
  if (hurst < 0.45) return "mean_reverting";
  return "random";
}

// ============================================================================
// KELLY CRITERION
// ============================================================================

/**
 * Calculate Kelly fraction for optimal position sizing
 *
 * @param winRate - Historical win rate (0-1)
 * @param avgWinLossRatio - Average win / average loss
 * @param fraction - Kelly fraction to use (default 0.5 = Half-Kelly)
 * @returns Optimal position size as fraction of capital
 */
export function kellyFraction(
  winRate: number,
  avgWinLossRatio: number,
  fraction: number = 0.5
): number {
  if (avgWinLossRatio <= 0 || winRate <= 0 || winRate >= 1) return 0;

  // Kelly formula: f* = (p * b - q) / b
  // where p = win rate, q = loss rate, b = win/loss ratio
  const q = 1 - winRate;
  const fullKelly = (winRate * avgWinLossRatio - q) / avgWinLossRatio;

  // Apply fraction (Half-Kelly recommended for safety)
  const kelly = fullKelly * fraction;

  // Clamp to reasonable bounds [0, 0.25] - never risk more than 25%
  return Math.max(0, Math.min(0.25, kelly));
}

/**
 * Calculate position size using Kelly criterion with volatility adjustment
 *
 * @param accountValue - Total account value in USD
 * @param currentPrice - Current asset price
 * @param winRate - Historical win rate
 * @param avgWinLossRatio - Average win / average loss
 * @param volatility - Current ATR percentage
 * @param avgVolatility - Average ATR percentage
 * @returns Position size in base asset units
 */
export function kellyPositionSize(
  accountValue: number,
  currentPrice: number,
  winRate: number,
  avgWinLossRatio: number,
  volatility: number,
  avgVolatility: number
): number {
  const kelly = kellyFraction(winRate, avgWinLossRatio, 0.5);

  // Volatility adjustment: reduce size when vol is high
  const volAdjustment = avgVolatility > 0 ? Math.min(1, avgVolatility / volatility) : 1;

  const adjustedKelly = kelly * volAdjustment;
  const positionValue = accountValue * adjustedKelly;

  return positionValue / currentPrice;
}

// ============================================================================
// ADAPTIVE PARAMETER SCALING
// ============================================================================

/**
 * Scale indicator period based on current volatility
 * Higher volatility = longer periods to filter noise
 *
 * @param basePeriod - Base indicator period
 * @param currentAtr - Current ATR value
 * @param avgAtr - Average ATR value (e.g., 30-day average)
 * @param minScale - Minimum scaling factor (default 0.5)
 * @param maxScale - Maximum scaling factor (default 2.0)
 * @returns Scaled period (rounded to integer)
 */
export function adaptivePeriod(
  basePeriod: number,
  currentAtr: number,
  avgAtr: number,
  minScale: number = 0.5,
  maxScale: number = 2.0
): number {
  if (avgAtr === 0) return basePeriod;

  const volRatio = currentAtr / avgAtr;
  const scale = Math.max(minScale, Math.min(maxScale, volRatio));

  return Math.round(basePeriod * scale);
}

/**
 * Calculate adaptive Bollinger Band width based on regime
 * Mean reverting regimes use tighter bands
 * Trending regimes use wider bands
 */
export function adaptiveBBWidth(
  baseWidth: number,
  hurst: number
): number {
  // Mean reverting (H < 0.5): tighter bands (0.8x to 1.0x)
  // Trending (H > 0.5): wider bands (1.0x to 1.5x)
  const adjustment = 0.5 + hurst; // Maps [0,1] to [0.5, 1.5]
  return baseWidth * adjustment;
}

/**
 * Calculate adaptive RSI thresholds based on regime
 */
export interface RSIThresholds {
  oversold: number;
  overbought: number;
}

export function adaptiveRSIThresholds(hurst: number): RSIThresholds {
  // Mean reverting: use standard thresholds (30/70)
  // Trending: use more extreme thresholds (20/80) to avoid false signals
  if (hurst > 0.55) {
    return { oversold: 20, overbought: 80 };
  }
  if (hurst < 0.45) {
    return { oversold: 35, overbought: 65 };
  }
  return { oversold: 30, overbought: 70 };
}

// ============================================================================
// VOLATILITY METRICS
// ============================================================================

/**
 * Calculate realized volatility (annualized)
 */
export function realizedVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period + 1) return 0;

  const returns: number[] = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;

  // Annualize (assuming ~365 days for crypto)
  return Math.sqrt(variance * 365) * 100;
}

/**
 * Calculate volatility percentile (where current vol sits in historical range)
 */
export function volatilityPercentile(
  prices: number[],
  period: number = 14,
  lookback: number = 100
): number {
  if (prices.length < lookback + period) return 50;

  const currentVol = atr(prices, period);
  const historicalVols: number[] = [];

  for (let i = period; i < lookback; i++) {
    const slice = prices.slice(0, prices.length - lookback + i);
    historicalVols.push(atr(slice, period));
  }

  const below = historicalVols.filter(v => v < currentVol).length;
  return (below / historicalVols.length) * 100;
}

// ============================================================================
// TREND STRENGTH
// ============================================================================

/**
 * Average Directional Index (ADX) - measures trend strength
 * ADX > 25: Strong trend
 * ADX < 20: Weak/no trend (ranging market)
 */
export function adx(prices: number[], period: number = 14): number {
  if (prices.length < period * 2) return 0;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const upMove = prices[i] - prices[i - 1];
    const downMove = prices[i - 1] - prices[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.abs(prices[i] - prices[i - 1]));
  }

  // Smoothed values
  const smoothedTR = ema(tr, period);
  const smoothedPlusDM = ema(plusDM, period);
  const smoothedMinusDM = ema(minusDM, period);

  if (smoothedTR === 0) return 0;

  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;

  const diSum = plusDI + minusDI;
  if (diSum === 0) return 0;

  const dx = (Math.abs(plusDI - minusDI) / diSum) * 100;

  // ADX is smoothed DX
  return dx; // Simplified - would normally smooth over multiple DX values
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export interface IndicatorSet {
  sma10: number;
  sma20: number;
  sma30: number;
  ema10: number;
  ema20: number;
  rsi14: number;
  atr14: number;
  atrPercent: number;
  hurst: number;
  regime: MarketRegime;
  adx: number;
  realizedVol: number;
  volPercentile: number;
}

/**
 * Calculate all key indicators at once
 */
export function calculateIndicators(prices: number[]): IndicatorSet {
  const hurstValue = hurstExponent(prices);

  return {
    sma10: sma(prices, 10),
    sma20: sma(prices, 20),
    sma30: sma(prices, 30),
    ema10: ema(prices, 10),
    ema20: ema(prices, 20),
    rsi14: rsi(prices, 14),
    atr14: atr(prices, 14),
    atrPercent: atrPercent(prices, 14),
    hurst: hurstValue,
    regime: classifyRegime(hurstValue),
    adx: adx(prices, 14),
    realizedVol: realizedVolatility(prices, 20),
    volPercentile: volatilityPercentile(prices, 14, 100),
  };
}
