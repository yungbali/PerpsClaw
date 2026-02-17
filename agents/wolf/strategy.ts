import { Strategy, StrategyContext, TradeSignal } from "../shared/types.js";

/**
 * Wolf — Mean Reversion strategy
 * Bollinger Bands(20, 2) with RSI(14) confirmation.
 * Goes long when price below lower band + RSI < 30.
 * Goes short when price above upper band + RSI > 70.
 */

function sma(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function stdDev(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

function rsi(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // neutral

  const changes = [];
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

export const wolfStrategy: Strategy = {
  name: "Mean Reversion (Bollinger + RSI)",

  evaluate(ctx: StrategyContext): TradeSignal {
    const { priceHistory, currentPrice, positionSize } = ctx;
    const none: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    if (priceHistory.length < 21) {
      return { ...none, reason: "Insufficient data" };
    }

    const bbPeriod = 20;
    const bbMult = 2;
    const middle = sma(priceHistory, bbPeriod);
    const sd = stdDev(priceHistory, bbPeriod);
    const upper = middle + bbMult * sd;
    const lower = middle - bbMult * sd;
    const rsiVal = rsi(priceHistory);

    const tradeSize = 0.4;

    // Oversold: price below lower band + RSI < 30
    if (currentPrice < lower && rsiVal < 30) {
      if (positionSize < 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.8,
          reason: "Close short: oversold reversal",
        };
      }
      if (positionSize === 0) {
        return {
          direction: "long",
          size: tradeSize,
          confidence: 0.7,
          reason: `Oversold: price=${currentPrice.toFixed(2)} < BB_lower=${lower.toFixed(2)}, RSI=${rsiVal.toFixed(1)}`,
        };
      }
    }

    // Overbought: price above upper band + RSI > 70
    if (currentPrice > upper && rsiVal > 70) {
      if (positionSize > 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.8,
          reason: "Close long: overbought reversal",
        };
      }
      if (positionSize === 0) {
        return {
          direction: "short",
          size: tradeSize,
          confidence: 0.7,
          reason: `Overbought: price=${currentPrice.toFixed(2)} > BB_upper=${upper.toFixed(2)}, RSI=${rsiVal.toFixed(1)}`,
        };
      }
    }

    // Mean reversion close: price returns to middle band
    if (positionSize !== 0) {
      const nearMiddle = Math.abs(currentPrice - middle) / middle < 0.005;
      if (nearMiddle) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.6,
          reason: `Mean revert: price near BB middle=${middle.toFixed(2)}`,
        };
      }
    }

    return none;
  },
};
