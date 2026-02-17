import { Strategy, StrategyContext, TradeSignal } from "../shared/types.js";

/**
 * Shark — Momentum strategy
 * SMA(10) crosses SMA(30) with 20-candle breakout filter.
 * Goes long on bullish crossover + new 20-period high.
 * Goes short on bearish crossover + new 20-period low.
 */

function sma(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export const sharkStrategy: Strategy = {
  name: "Momentum (SMA Crossover)",

  evaluate(ctx: StrategyContext): TradeSignal {
    const { priceHistory, currentPrice, positionSize } = ctx;
    const none: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    // Need at least 30 data points
    if (priceHistory.length < 30) {
      return { ...none, reason: "Insufficient data" };
    }

    const sma10 = sma(priceHistory, 10);
    const sma30 = sma(priceHistory, 30);

    // Previous values for crossover detection
    const prevPrices = priceHistory.slice(0, -1);
    const prevSma10 = sma(prevPrices, 10);
    const prevSma30 = sma(prevPrices, 30);

    // Breakout filter: 20-candle high/low
    const recent20 = priceHistory.slice(-20);
    const high20 = Math.max(...recent20);
    const low20 = Math.min(...recent20);

    const bullishCross = prevSma10 <= prevSma30 && sma10 > sma30;
    const bearishCross = prevSma10 >= prevSma30 && sma10 < sma30;

    // Position size: use ~0.5 SOL per trade (half budget at current leverage)
    const tradeSize = 0.5;

    // Bullish crossover + breakout
    if (bullishCross && currentPrice >= high20) {
      if (positionSize < 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.8,
          reason: "Close short: bullish SMA cross + breakout",
        };
      }
      if (positionSize === 0) {
        return {
          direction: "long",
          size: tradeSize,
          confidence: 0.75,
          reason: `SMA(10)=${sma10.toFixed(2)} > SMA(30)=${sma30.toFixed(2)} + 20-high breakout`,
        };
      }
    }

    // Bearish crossover + breakdown
    if (bearishCross && currentPrice <= low20) {
      if (positionSize > 0) {
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.8,
          reason: "Close long: bearish SMA cross + breakdown",
        };
      }
      if (positionSize === 0) {
        return {
          direction: "short",
          size: tradeSize,
          confidence: 0.75,
          reason: `SMA(10)=${sma10.toFixed(2)} < SMA(30)=${sma30.toFixed(2)} + 20-low breakdown`,
        };
      }
    }

    return none;
  },
};
