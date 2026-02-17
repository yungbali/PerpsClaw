#!/usr/bin/env npx tsx
/**
 * Fetch current SOL price and recent history from Pyth oracle.
 * Usage: npx tsx scripts/price.ts
 */
import { fetchSolPrice, fetchPriceHistory, output } from "./lib.js";

async function main() {
  try {
    const current = await fetchSolPrice();
    const history = await fetchPriceHistory(50);

    // Calculate key levels from history
    const prices = history.map((h) => h.price);
    const high24h = Math.max(...prices);
    const low24h = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const change1h =
      prices.length > 1
        ? ((current.price - prices[prices.length - 2]) /
            prices[prices.length - 2]) *
          100
        : 0;

    // Simple SMA calculations for the agent to reason about
    const sma10 =
      prices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, prices.length);
    const sma30 =
      prices.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, prices.length);

    // RSI(14) calculation
    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = Math.max(1, prices.length - 14); i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) {
        gains.push(diff);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(diff));
      }
    }
    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length || 0;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length || 0.001;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    // Bollinger Bands (20-period)
    const bb20 = prices.slice(-20);
    const bbMean = bb20.reduce((a, b) => a + b, 0) / bb20.length;
    const bbStd = Math.sqrt(
      bb20.reduce((a, b) => a + Math.pow(b - bbMean, 2), 0) / bb20.length
    );
    const bbUpper = bbMean + 2 * bbStd;
    const bbLower = bbMean - 2 * bbStd;

    output({
      ok: true,
      data: {
        current: {
          price: Number(current.price.toFixed(4)),
          confidence: Number(current.confidence.toFixed(4)),
          timestamp: current.timestamp,
        },
        levels: {
          high24h: Number(high24h.toFixed(4)),
          low24h: Number(low24h.toFixed(4)),
          average: Number(avg.toFixed(4)),
          change1hPct: Number(change1h.toFixed(4)),
        },
        indicators: {
          sma10: Number(sma10.toFixed(4)),
          sma30: Number(sma30.toFixed(4)),
          smaCrossover: sma10 > sma30 ? "bullish" : "bearish",
          rsi14: Number(rsi.toFixed(2)),
          rsiSignal:
            rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral",
          bollingerUpper: Number(bbUpper.toFixed(4)),
          bollingerMiddle: Number(bbMean.toFixed(4)),
          bollingerLower: Number(bbLower.toFixed(4)),
          priceVsBollinger:
            current.price > bbUpper
              ? "above_upper"
              : current.price < bbLower
                ? "below_lower"
                : "within_bands",
        },
        recentPrices: prices.slice(-10).map((p) => Number(p.toFixed(4))),
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    output({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
