import { Strategy, StrategyContext, TradeSignal } from "../shared/types.js";
import {
  sma,
  stdDev,
  rsi,
  atr,
  hurstExponent,
  classifyRegime,
  adaptiveBBWidth,
  adaptiveRSIThresholds,
} from "../shared/indicators.js";

/**
 * Wolf — Enhanced Mean Reversion Strategy
 *
 * Original: Bollinger Bands(20, 2) with RSI(14) confirmation.
 *
 * Enhanced with:
 * - Adaptive Bollinger Band width based on regime
 * - Adaptive RSI thresholds based on regime
 * - Regime filtering (only trades in mean-reverting markets)
 * - Hurst exponent validation
 * - Funding rate contrarian signals
 * - Dynamic position sizing based on confidence
 */

// Default configuration
const DEFAULT_BB_PERIOD = 20;
const DEFAULT_BB_WIDTH = 2;
const DEFAULT_RSI_PERIOD = 14;
const DEFAULT_TRADE_SIZE = 0.4;

export const wolfStrategy: Strategy = {
  name: "Mean Reversion (Adaptive Bollinger + RSI)",

  evaluate(ctx: StrategyContext): TradeSignal {
    const { priceHistory, currentPrice, positionSize } = ctx;
    const none: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    // Need at least 30 data points for calculations
    if (priceHistory.length < 30) {
      return { ...none, reason: "Insufficient data (need 30+ candles)" };
    }

    // =========================================================================
    // REGIME ANALYSIS
    // =========================================================================

    const hurst = ctx.hurst ?? hurstExponent(priceHistory);
    const regime = ctx.regime ?? classifyRegime(hurst);

    // Wolf is a mean reversion strategy - performs best in mean-reverting regime
    // But can also work in "random" regime with caution
    if (regime === "trending" && hurst > 0.6) {
      // Strong trending - definitely avoid mean reversion
      if (positionSize !== 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.7,
          reason: `Strong trend detected (H=${hurst.toFixed(2)}), closing mean reversion position`,
        };
      }
      return {
        ...none,
        reason: `Strong trending regime (H=${hurst.toFixed(2)}), Wolf inactive`,
      };
    }

    // =========================================================================
    // ADAPTIVE PARAMETERS
    // =========================================================================

    // Adapt BB width based on Hurst
    // Mean reverting (low H) = tighter bands work better
    // Random/trending = wider bands to avoid false signals
    const adaptedBBWidth = adaptiveBBWidth(DEFAULT_BB_WIDTH, hurst);

    // Adapt RSI thresholds based on regime
    const rsiThresholds = adaptiveRSIThresholds(hurst);

    // =========================================================================
    // INDICATOR CALCULATIONS
    // =========================================================================

    const bbPeriod = DEFAULT_BB_PERIOD;
    const middle = sma(priceHistory, bbPeriod);
    const sd = stdDev(priceHistory, bbPeriod);
    const upper = middle + adaptedBBWidth * sd;
    const lower = middle - adaptedBBWidth * sd;
    const rsiVal = ctx.rsi ?? rsi(priceHistory, DEFAULT_RSI_PERIOD);

    // Calculate ATR for volatility context
    const currentAtr = ctx.atr ?? atr(priceHistory, 14);
    const atrPercent = ctx.atrPercent ?? (currentAtr / currentPrice) * 100;

    // Band width as percentage of price (for sizing)
    const bandWidthPct = ((upper - lower) / middle) * 100;

    // Distance from bands (normalized)
    const distFromUpper = (upper - currentPrice) / sd;
    const distFromLower = (currentPrice - lower) / sd;

    // =========================================================================
    // FUNDING RATE SIGNAL (CONTRARIAN)
    // =========================================================================

    let fundingBias = 0;
    if (ctx.marketData?.funding) {
      const funding = ctx.marketData.funding;
      if (funding.isExtreme) {
        // Extreme positive = crowded longs = bearish bias (contrarian)
        // Extreme negative = crowded shorts = bullish bias (contrarian)
        fundingBias = funding.direction === "longs_pay" ? -0.2 : 0.2;
      }
    }

    // =========================================================================
    // POSITION SIZING
    // =========================================================================

    let tradeSize = DEFAULT_TRADE_SIZE;

    // Adjust for Hurst (mean reversion confidence)
    if (hurst < 0.4) {
      tradeSize *= 1.15; // Strong mean reverting behavior
    } else if (hurst > 0.5) {
      tradeSize *= 0.75; // Less confident in mean reversion
    }

    // Adjust for volatility
    if (atrPercent > 3) {
      tradeSize *= 0.7; // High volatility = smaller size
    }

    // Adjust for band width (wider bands = less certain extremes)
    if (bandWidthPct > 8) {
      tradeSize *= 0.8;
    }

    // Clamp trade size
    tradeSize = Math.max(0.1, Math.min(0.8, tradeSize));

    // =========================================================================
    // CONFIDENCE CALCULATION
    // =========================================================================

    const calculateConfidence = (
      baseConfidence: number,
      distFromBand: number,
      rsiExtreme: boolean
    ): number => {
      let conf = baseConfidence;

      // Distance from band contribution (further = more confident)
      if (distFromBand > 1.5) conf += 0.1;
      else if (distFromBand < 0.5) conf -= 0.1;

      // RSI extreme contribution
      if (rsiExtreme) conf += 0.1;

      // Hurst contribution (lower = more confident for mean reversion)
      if (hurst < 0.4) conf += 0.1;
      else if (hurst > 0.55) conf -= 0.15;

      // Funding bias contribution
      conf += Math.abs(fundingBias) * 0.5;

      return Math.max(0.1, Math.min(0.9, conf));
    };

    // =========================================================================
    // ENTRY SIGNALS
    // =========================================================================

    // Oversold: price below lower band + RSI oversold + (optional) funding supports
    const isOversold = currentPrice < lower && rsiVal < rsiThresholds.oversold;
    const oversoldWithFunding = isOversold && fundingBias >= 0; // Neutral or bullish funding

    if (isOversold) {
      if (positionSize < 0) {
        // Close short on oversold (mean reversion opportunity)
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: calculateConfidence(0.8, distFromLower, true),
          reason: `Close short: oversold reversal (RSI=${rsiVal.toFixed(1)}, H=${hurst.toFixed(2)})`,
        };
      }
      if (positionSize === 0) {
        // Open long on oversold
        const confidenceBoost = oversoldWithFunding ? 0.05 : 0;
        return {
          direction: "long",
          size: tradeSize,
          confidence: calculateConfidence(0.7 + confidenceBoost, distFromLower, true),
          reason: `Oversold: price=${currentPrice.toFixed(2)} < BB_lower=${lower.toFixed(2)}, RSI=${rsiVal.toFixed(1)} < ${rsiThresholds.oversold} (H=${hurst.toFixed(2)}, BB_width=${adaptedBBWidth.toFixed(2)})`,
        };
      }
    }

    // Overbought: price above upper band + RSI overbought + (optional) funding supports
    const isOverbought = currentPrice > upper && rsiVal > rsiThresholds.overbought;
    const overboughtWithFunding = isOverbought && fundingBias <= 0; // Neutral or bearish funding

    if (isOverbought) {
      if (positionSize > 0) {
        // Close long on overbought (mean reversion opportunity)
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: calculateConfidence(0.8, distFromUpper, true),
          reason: `Close long: overbought reversal (RSI=${rsiVal.toFixed(1)}, H=${hurst.toFixed(2)})`,
        };
      }
      if (positionSize === 0) {
        // Open short on overbought
        const confidenceBoost = overboughtWithFunding ? 0.05 : 0;
        return {
          direction: "short",
          size: tradeSize,
          confidence: calculateConfidence(0.7 + confidenceBoost, distFromUpper, true),
          reason: `Overbought: price=${currentPrice.toFixed(2)} > BB_upper=${upper.toFixed(2)}, RSI=${rsiVal.toFixed(1)} > ${rsiThresholds.overbought} (H=${hurst.toFixed(2)}, BB_width=${adaptedBBWidth.toFixed(2)})`,
        };
      }
    }

    // =========================================================================
    // MEAN REVERSION EXIT (PROFIT TARGET)
    // =========================================================================

    // Close when price returns to middle band
    if (positionSize !== 0) {
      const nearMiddle = Math.abs(currentPrice - middle) / middle < 0.005;

      if (nearMiddle) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.65,
          reason: `Mean revert target: price near BB middle=${middle.toFixed(2)}`,
        };
      }

      // Partial close at 50% of the way to middle
      const entryPrice = ctx.entryPrice;
      if (entryPrice > 0) {
        const halfwayToMiddle =
          positionSize > 0
            ? entryPrice + (middle - entryPrice) * 0.5
            : entryPrice - (entryPrice - middle) * 0.5;

        const reachedHalfway =
          (positionSize > 0 && currentPrice >= halfwayToMiddle) ||
          (positionSize < 0 && currentPrice <= halfwayToMiddle);

        if (reachedHalfway && Math.abs(positionSize) > tradeSize * 0.5) {
          return {
            direction: "close",
            size: Math.abs(positionSize) * 0.5, // Partial close
            confidence: 0.6,
            reason: `Partial profit: 50% move toward middle band`,
          };
        }
      }
    }

    // =========================================================================
    // EARLY EXIT ON REGIME CHANGE
    // =========================================================================

    // If holding a position and regime starts trending, exit early
    if (positionSize !== 0 && hurst > 0.55) {
      // Check if price is moving against us consistently
      const recent5 = priceHistory.slice(-5);
      const priceMovement = (recent5[4] - recent5[0]) / recent5[0];

      const movingAgainst =
        (positionSize > 0 && priceMovement < -0.02) ||
        (positionSize < 0 && priceMovement > 0.02);

      if (movingAgainst) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.7,
          reason: `Exit: regime shifting to trending (H=${hurst.toFixed(2)}) and price moving against position`,
        };
      }
    }

    // =========================================================================
    // ADDITIONAL ENTRY: STRONG OVERSOLD/OVERBOUGHT WITH RSI DIVERGENCE
    // =========================================================================

    // RSI divergence: price making new low but RSI not (bullish divergence)
    if (positionSize === 0) {
      const recent10 = priceHistory.slice(-10);
      const priceLow = Math.min(...recent10);
      const priceHigh = Math.max(...recent10);

      // Bullish divergence near lower band
      if (currentPrice < lower * 1.01 && currentPrice > priceLow && rsiVal > 35) {
        // Price near lower band but not making new low, RSI recovering
        return {
          direction: "long",
          size: tradeSize * 0.75,
          confidence: calculateConfidence(0.6, distFromLower, false),
          reason: `Bullish divergence near BB lower: price recovering, RSI=${rsiVal.toFixed(1)}`,
        };
      }

      // Bearish divergence near upper band
      if (currentPrice > upper * 0.99 && currentPrice < priceHigh && rsiVal < 65) {
        return {
          direction: "short",
          size: tradeSize * 0.75,
          confidence: calculateConfidence(0.6, distFromUpper, false),
          reason: `Bearish divergence near BB upper: price weakening, RSI=${rsiVal.toFixed(1)}`,
        };
      }
    }

    return none;
  },
};
