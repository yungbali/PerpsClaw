import { Strategy, StrategyContext, TradeSignal } from "../shared/types.js";
import {
  sma,
  atr,
  adaptivePeriod,
  adx,
  hurstExponent,
  classifyRegime,
} from "../shared/indicators.js";

/**
 * Shark — Enhanced Momentum Strategy
 *
 * Original: SMA(10) crosses SMA(30) with 20-candle breakout filter.
 *
 * Enhanced with:
 * - Adaptive SMA periods based on volatility (ATR-scaled)
 * - Regime filtering (only trades in trending markets)
 * - ADX confirmation for trend strength
 * - Hurst exponent validation
 * - Dynamic position sizing based on confidence
 */

// Default configuration (can be overridden by config)
const DEFAULT_SMA_FAST = 10;
const DEFAULT_SMA_SLOW = 30;
const DEFAULT_BREAKOUT_PERIOD = 20;
const DEFAULT_TRADE_SIZE = 0.5;

// Adaptive parameters
const MIN_ADX_FOR_TRADE = 20; // Only trade when ADX > 20
const MIN_HURST_FOR_MOMENTUM = 0.5; // Only momentum when H > 0.5

export const sharkStrategy: Strategy = {
  name: "Momentum (Adaptive SMA Crossover)",

  evaluate(ctx: StrategyContext): TradeSignal {
    const { priceHistory, currentPrice, positionSize } = ctx;
    const none: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    // Need at least 50 data points for adaptive calculations
    if (priceHistory.length < 50) {
      return { ...none, reason: "Insufficient data (need 50+ candles)" };
    }

    // =========================================================================
    // REGIME FILTERING
    // =========================================================================

    // Check if regime filtering is enabled and if we should trade
    const hurst = ctx.hurst ?? hurstExponent(priceHistory);
    const regime = ctx.regime ?? classifyRegime(hurst);

    // Shark is a momentum strategy - only active in trending regime
    if (regime === "mean_reverting") {
      // Close any existing position if regime changed
      if (positionSize !== 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.6,
          reason: `Regime changed to mean_reverting (H=${hurst.toFixed(2)}), closing momentum position`,
        };
      }
      return {
        ...none,
        reason: `Regime is mean_reverting (H=${hurst.toFixed(2)}), Shark inactive`,
      };
    }

    // Check ADX for trend strength
    const adxValue = ctx.adx ?? adx(priceHistory, 14);
    if (adxValue < MIN_ADX_FOR_TRADE && positionSize === 0) {
      return {
        ...none,
        reason: `Weak trend (ADX=${adxValue.toFixed(1)} < ${MIN_ADX_FOR_TRADE}), waiting for stronger trend`,
      };
    }

    // =========================================================================
    // ADAPTIVE PARAMETERS
    // =========================================================================

    // Calculate ATR for adaptive scaling
    const currentAtr = ctx.atr ?? atr(priceHistory, 14);
    const avgAtr = ctx.avgAtr ?? atr(priceHistory.slice(0, -14), 30);

    // Scale SMA periods based on volatility
    // Higher volatility = longer periods to filter noise
    let smaFastPeriod = DEFAULT_SMA_FAST;
    let smaSlowPeriod = DEFAULT_SMA_SLOW;
    let breakoutPeriod = DEFAULT_BREAKOUT_PERIOD;

    if (avgAtr > 0) {
      smaFastPeriod = adaptivePeriod(DEFAULT_SMA_FAST, currentAtr, avgAtr, 0.7, 1.5);
      smaSlowPeriod = adaptivePeriod(DEFAULT_SMA_SLOW, currentAtr, avgAtr, 0.7, 1.5);
      breakoutPeriod = adaptivePeriod(DEFAULT_BREAKOUT_PERIOD, currentAtr, avgAtr, 0.8, 1.3);
    }

    // Ensure we have enough data for adaptive periods
    if (priceHistory.length < smaSlowPeriod + 1) {
      return { ...none, reason: `Insufficient data for SMA(${smaSlowPeriod})` };
    }

    // =========================================================================
    // INDICATOR CALCULATIONS
    // =========================================================================

    const smaFast = sma(priceHistory, smaFastPeriod);
    const smaSlow = sma(priceHistory, smaSlowPeriod);

    // Previous values for crossover detection
    const prevPrices = priceHistory.slice(0, -1);
    const prevSmaFast = sma(prevPrices, smaFastPeriod);
    const prevSmaSlow = sma(prevPrices, smaSlowPeriod);

    // Breakout filter: N-candle high/low
    const recentN = priceHistory.slice(-breakoutPeriod);
    const highN = Math.max(...recentN);
    const lowN = Math.min(...recentN);

    // Crossover detection
    const bullishCross = prevSmaFast <= prevSmaSlow && smaFast > smaSlow;
    const bearishCross = prevSmaFast >= prevSmaSlow && smaFast < smaSlow;

    // Trend confirmation: price above/below both SMAs
    const bullishTrend = currentPrice > smaFast && currentPrice > smaSlow;
    const bearishTrend = currentPrice < smaFast && currentPrice < smaSlow;

    // =========================================================================
    // POSITION SIZING
    // =========================================================================

    // Base trade size
    let tradeSize = DEFAULT_TRADE_SIZE;

    // Adjust for trend strength (ADX)
    if (adxValue > 30) {
      tradeSize *= 1.2; // Stronger trend = slightly larger position
    } else if (adxValue < 25) {
      tradeSize *= 0.8; // Weaker trend = smaller position
    }

    // Adjust for Hurst (momentum confidence)
    if (hurst > 0.6) {
      tradeSize *= 1.1; // Strong trending behavior
    }

    // Adjust for volatility (reduce in high vol)
    if (avgAtr > 0 && currentAtr > avgAtr * 1.5) {
      tradeSize *= 0.7; // High volatility = reduce size
    }

    // Clamp trade size
    tradeSize = Math.max(0.1, Math.min(1.0, tradeSize));

    // =========================================================================
    // SIGNAL GENERATION
    // =========================================================================

    // Calculate confidence based on multiple factors
    const calculateConfidence = (baseConfidence: number): number => {
      let conf = baseConfidence;

      // ADX contribution
      if (adxValue > 30) conf += 0.1;
      else if (adxValue < 20) conf -= 0.1;

      // Hurst contribution
      if (hurst > 0.6) conf += 0.05;
      else if (hurst < 0.5) conf -= 0.1;

      // Trend alignment contribution
      if (bullishTrend || bearishTrend) conf += 0.05;

      return Math.max(0.1, Math.min(0.95, conf));
    };

    // Bullish crossover + breakout + trend confirmation
    if (bullishCross && currentPrice >= highN * 0.995 && bullishTrend) {
      if (positionSize < 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: calculateConfidence(0.8),
          reason: `Close short: bullish SMA(${smaFastPeriod}/${smaSlowPeriod}) cross + breakout (ADX=${adxValue.toFixed(1)}, H=${hurst.toFixed(2)})`,
        };
      }
      if (positionSize === 0) {
        return {
          direction: "long",
          size: tradeSize,
          confidence: calculateConfidence(0.75),
          reason: `Bullish: SMA(${smaFastPeriod})=${smaFast.toFixed(2)} > SMA(${smaSlowPeriod})=${smaSlow.toFixed(2)} + ${breakoutPeriod}-high breakout (ADX=${adxValue.toFixed(1)}, H=${hurst.toFixed(2)})`,
        };
      }
    }

    // Bearish crossover + breakdown + trend confirmation
    if (bearishCross && currentPrice <= lowN * 1.005 && bearishTrend) {
      if (positionSize > 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: calculateConfidence(0.8),
          reason: `Close long: bearish SMA(${smaFastPeriod}/${smaSlowPeriod}) cross + breakdown (ADX=${adxValue.toFixed(1)}, H=${hurst.toFixed(2)})`,
        };
      }
      if (positionSize === 0) {
        return {
          direction: "short",
          size: tradeSize,
          confidence: calculateConfidence(0.75),
          reason: `Bearish: SMA(${smaFastPeriod})=${smaFast.toFixed(2)} < SMA(${smaSlowPeriod})=${smaSlow.toFixed(2)} + ${breakoutPeriod}-low breakdown (ADX=${adxValue.toFixed(1)}, H=${hurst.toFixed(2)})`,
        };
      }
    }

    // =========================================================================
    // TREND CONTINUATION SIGNALS (NEW)
    // =========================================================================

    // Strong trend continuation: price pulls back to fast SMA and bounces
    if (positionSize > 0 && bullishTrend && adxValue > 25) {
      // Check if price touched fast SMA and is now bouncing
      const recentLow = Math.min(...priceHistory.slice(-3));
      const touchedSma = recentLow <= smaFast * 1.01 && currentPrice > smaFast;

      if (touchedSma && positionSize < tradeSize * 0.8) {
        return {
          direction: "long",
          size: tradeSize * 0.5, // Add to position
          confidence: calculateConfidence(0.6),
          reason: `Trend continuation: pullback to SMA(${smaFastPeriod}) bounce (ADX=${adxValue.toFixed(1)})`,
        };
      }
    }

    if (positionSize < 0 && bearishTrend && adxValue > 25) {
      const recentHigh = Math.max(...priceHistory.slice(-3));
      const touchedSma = recentHigh >= smaFast * 0.99 && currentPrice < smaFast;

      if (touchedSma && Math.abs(positionSize) < tradeSize * 0.8) {
        return {
          direction: "short",
          size: tradeSize * 0.5,
          confidence: calculateConfidence(0.6),
          reason: `Trend continuation: pullback to SMA(${smaFastPeriod}) rejection (ADX=${adxValue.toFixed(1)})`,
        };
      }
    }

    // =========================================================================
    // EXIT SIGNALS
    // =========================================================================

    // Exit long if trend weakens significantly
    if (positionSize > 0) {
      // SMA convergence (trend weakening)
      const smaGap = (smaFast - smaSlow) / smaSlow;
      if (smaGap < 0.001 && smaGap > -0.001) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.65,
          reason: `Exit long: SMA convergence (gap=${(smaGap * 100).toFixed(3)}%), trend weakening`,
        };
      }
    }

    // Exit short if trend weakens significantly
    if (positionSize < 0) {
      const smaGap = (smaSlow - smaFast) / smaSlow;
      if (smaGap < 0.001 && smaGap > -0.001) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.65,
          reason: `Exit short: SMA convergence (gap=${(smaGap * 100).toFixed(3)}%), trend weakening`,
        };
      }
    }

    return none;
  },
};
