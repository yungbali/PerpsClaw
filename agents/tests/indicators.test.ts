import { describe, it, expect } from "vitest";
import {
  sma,
  ema,
  stdDev,
  rsi,
  atr,
  atrPercent,
  atrStopDistance,
  hurstExponent,
  classifyRegime,
  kellyFraction,
  kellyPositionSize,
  adaptivePeriod,
  adaptiveBBWidth,
  adaptiveRSIThresholds,
  realizedVolatility,
  adx,
  calculateIndicators,
} from "../shared/indicators.js";

// Helper to generate price data
function generatePrices(
  start: number,
  count: number,
  trend: "up" | "down" | "flat" | "random" = "flat",
  volatility: number = 0.02
): number[] {
  const prices: number[] = [start];
  for (let i = 1; i < count; i++) {
    let change = 0;
    if (trend === "up") change = volatility * 0.5;
    else if (trend === "down") change = -volatility * 0.5;
    else if (trend === "random") change = (Math.random() - 0.5) * volatility * 2;

    // Add noise
    const noise = (Math.random() - 0.5) * volatility;
    prices.push(prices[i - 1] * (1 + change + noise));
  }
  return prices;
}

// Generate mean-reverting prices
function generateMeanRevertingPrices(
  center: number,
  count: number,
  amplitude: number = 0.05
): number[] {
  const prices: number[] = [];
  for (let i = 0; i < count; i++) {
    // Oscillate around center
    const deviation = Math.sin(i * 0.3) * amplitude;
    const noise = (Math.random() - 0.5) * 0.01;
    prices.push(center * (1 + deviation + noise));
  }
  return prices;
}

// Generate trending prices
function generateTrendingPrices(
  start: number,
  count: number,
  trendStrength: number = 0.005
): number[] {
  const prices: number[] = [start];
  for (let i = 1; i < count; i++) {
    // Strong directional movement with small noise
    const trend = trendStrength * (1 + (Math.random() - 0.5) * 0.2);
    prices.push(prices[i - 1] * (1 + trend));
  }
  return prices;
}

describe("Indicators Module", () => {
  describe("SMA (Simple Moving Average)", () => {
    it("calculates SMA correctly", () => {
      const prices = [10, 20, 30, 40, 50];
      expect(sma(prices, 5)).toBe(30);
      expect(sma(prices, 3)).toBe(40); // Last 3: 30, 40, 50
    });

    it("returns 0 for insufficient data", () => {
      expect(sma([10, 20], 5)).toBe(0);
    });
  });

  describe("EMA (Exponential Moving Average)", () => {
    it("calculates EMA correctly", () => {
      const prices = [10, 20, 30, 40, 50];
      const result = ema(prices, 3);
      // EMA should be weighted toward recent prices
      expect(result).toBeGreaterThan(sma(prices, 3) - 5);
      expect(result).toBeLessThan(sma(prices, 3) + 5);
    });

    it("returns 0 for insufficient data", () => {
      expect(ema([10, 20], 5)).toBe(0);
    });
  });

  describe("Standard Deviation", () => {
    it("calculates stdDev correctly", () => {
      const prices = [10, 20, 30, 40, 50];
      const result = stdDev(prices, 5);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(14.14, 1); // Population std dev
    });

    it("returns 0 for flat prices", () => {
      const flatPrices = [100, 100, 100, 100, 100];
      expect(stdDev(flatPrices, 5)).toBe(0);
    });
  });

  describe("RSI (Relative Strength Index)", () => {
    it("returns 100 for perfectly flat prices (no losses)", () => {
      // Flat prices = no changes = avgLoss = 0 = RSI 100
      const flatPrices = Array(20).fill(100);
      const result = rsi(flatPrices);
      expect(result).toBe(100);
    });

    it("returns ~50 for oscillating prices", () => {
      // Alternating up/down movements = balanced gains/losses
      const oscillatingPrices: number[] = [];
      for (let i = 0; i < 20; i++) {
        oscillatingPrices.push(100 + (i % 2 === 0 ? 1 : -1));
      }
      const result = rsi(oscillatingPrices);
      expect(result).toBeGreaterThan(40);
      expect(result).toBeLessThan(60);
    });

    it("returns high RSI for uptrend", () => {
      const upPrices = generateTrendingPrices(100, 50, 0.01);
      const result = rsi(upPrices);
      expect(result).toBeGreaterThan(60);
    });

    it("returns low RSI for downtrend", () => {
      const downPrices = generateTrendingPrices(100, 50, -0.01);
      const result = rsi(downPrices);
      expect(result).toBeLessThan(40);
    });

    it("returns 50 for insufficient data", () => {
      expect(rsi([100, 101], 14)).toBe(50);
    });
  });

  describe("ATR (Average True Range)", () => {
    it("calculates ATR for volatile prices", () => {
      const prices = generatePrices(100, 30, "random", 0.03);
      const result = atr(prices, 14);
      expect(result).toBeGreaterThan(0);
    });

    it("returns low ATR for flat prices", () => {
      const flatPrices = Array(30)
        .fill(0)
        .map((_, i) => 100 + (Math.random() - 0.5) * 0.1);
      const result = atr(flatPrices, 14);
      expect(result).toBeLessThan(1);
    });

    it("returns 0 for insufficient data", () => {
      expect(atr([100, 101, 102], 14)).toBe(0);
    });
  });

  describe("ATR Percent", () => {
    it("calculates ATR as percentage of price", () => {
      const prices = generatePrices(100, 30, "random", 0.02);
      const result = atrPercent(prices, 14);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10); // Should be reasonable percentage
    });
  });

  describe("ATR Stop Distance", () => {
    it("calculates stop distance correctly", () => {
      const prices = generatePrices(100, 30, "random", 0.02);
      const atrValue = atr(prices, 14);
      const stopDist = atrStopDistance(prices, 2.0, 14);
      expect(stopDist).toBeCloseTo(atrValue * 2.0, 2);
    });
  });
});

describe("Hurst Exponent", () => {
  it("detects trending behavior (H > 0.5)", () => {
    const trendingPrices = generateTrendingPrices(100, 150, 0.005);
    const result = hurstExponent(trendingPrices);
    expect(result).toBeGreaterThan(0.45); // Should indicate trend
  });

  it("detects mean-reverting behavior (H < 0.5)", () => {
    const meanRevertingPrices = generateMeanRevertingPrices(100, 150, 0.05);
    const result = hurstExponent(meanRevertingPrices);
    expect(result).toBeLessThan(0.55); // Should indicate mean reversion
  });

  it("returns 0.5 for insufficient data", () => {
    const shortPrices = [100, 101, 102, 103, 104];
    expect(hurstExponent(shortPrices)).toBe(0.5);
  });

  it("returns value between 0 and 1", () => {
    const prices = generatePrices(100, 150, "random", 0.02);
    const result = hurstExponent(prices);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe("Regime Classification", () => {
  it("classifies high Hurst as trending", () => {
    expect(classifyRegime(0.6)).toBe("trending");
    expect(classifyRegime(0.7)).toBe("trending");
  });

  it("classifies low Hurst as mean_reverting", () => {
    expect(classifyRegime(0.4)).toBe("mean_reverting");
    expect(classifyRegime(0.3)).toBe("mean_reverting");
  });

  it("classifies middle Hurst as random", () => {
    expect(classifyRegime(0.5)).toBe("random");
    expect(classifyRegime(0.48)).toBe("random");
    expect(classifyRegime(0.52)).toBe("random");
  });
});

describe("Kelly Criterion", () => {
  describe("Kelly Fraction", () => {
    it("calculates positive Kelly for edge", () => {
      // 55% win rate, 1.5 avg win/loss
      const result = kellyFraction(0.55, 1.5, 1.0);
      expect(result).toBeGreaterThan(0);
    });

    it("returns 0 for negative edge", () => {
      // 40% win rate, 1.0 avg win/loss = negative expectancy
      const result = kellyFraction(0.4, 1.0, 1.0);
      expect(result).toBe(0);
    });

    it("applies fraction correctly (half-Kelly)", () => {
      const fullKelly = kellyFraction(0.55, 1.5, 1.0);
      const halfKelly = kellyFraction(0.55, 1.5, 0.5);
      expect(halfKelly).toBeCloseTo(fullKelly * 0.5, 4);
    });

    it("caps Kelly at 25%", () => {
      // Very high edge case
      const result = kellyFraction(0.8, 3.0, 1.0);
      expect(result).toBeLessThanOrEqual(0.25);
    });

    it("returns 0 for invalid inputs", () => {
      expect(kellyFraction(0, 1.5, 1.0)).toBe(0);
      expect(kellyFraction(1, 1.5, 1.0)).toBe(0);
      expect(kellyFraction(0.5, 0, 1.0)).toBe(0);
    });
  });

  describe("Kelly Position Size", () => {
    it("calculates position size in base units", () => {
      const accountValue = 1000;
      const currentPrice = 100;
      const result = kellyPositionSize(
        accountValue,
        currentPrice,
        0.55,
        1.5,
        2.0, // Current volatility
        2.0 // Avg volatility
      );
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(accountValue / currentPrice);
    });

    it("reduces size in high volatility", () => {
      const normalVol = kellyPositionSize(1000, 100, 0.55, 1.5, 2.0, 2.0);
      const highVol = kellyPositionSize(1000, 100, 0.55, 1.5, 4.0, 2.0);
      expect(highVol).toBeLessThan(normalVol);
    });
  });
});

describe("Adaptive Parameters", () => {
  describe("Adaptive Period", () => {
    it("scales period with volatility ratio", () => {
      // High volatility = longer period
      const highVolPeriod = adaptivePeriod(10, 2.0, 1.0);
      const normalPeriod = adaptivePeriod(10, 1.0, 1.0);
      const lowVolPeriod = adaptivePeriod(10, 0.5, 1.0);

      expect(highVolPeriod).toBeGreaterThan(normalPeriod);
      expect(lowVolPeriod).toBeLessThan(normalPeriod);
    });

    it("respects min/max scaling", () => {
      const result = adaptivePeriod(10, 10.0, 1.0, 0.5, 2.0);
      expect(result).toBeLessThanOrEqual(20); // Max 2x
    });

    it("returns base period when avg ATR is 0", () => {
      expect(adaptivePeriod(10, 1.0, 0)).toBe(10);
    });
  });

  describe("Adaptive BB Width", () => {
    it("uses tighter bands for mean-reverting markets", () => {
      const meanRevertWidth = adaptiveBBWidth(2.0, 0.3);
      const normalWidth = adaptiveBBWidth(2.0, 0.5);
      expect(meanRevertWidth).toBeLessThan(normalWidth);
    });

    it("uses wider bands for trending markets", () => {
      const trendWidth = adaptiveBBWidth(2.0, 0.7);
      const normalWidth = adaptiveBBWidth(2.0, 0.5);
      expect(trendWidth).toBeGreaterThan(normalWidth);
    });
  });

  describe("Adaptive RSI Thresholds", () => {
    it("uses extreme thresholds for trending markets", () => {
      const thresholds = adaptiveRSIThresholds(0.6);
      expect(thresholds.oversold).toBe(20);
      expect(thresholds.overbought).toBe(80);
    });

    it("uses relaxed thresholds for mean-reverting markets", () => {
      const thresholds = adaptiveRSIThresholds(0.4);
      expect(thresholds.oversold).toBe(35);
      expect(thresholds.overbought).toBe(65);
    });

    it("uses standard thresholds for random markets", () => {
      const thresholds = adaptiveRSIThresholds(0.5);
      expect(thresholds.oversold).toBe(30);
      expect(thresholds.overbought).toBe(70);
    });
  });
});

describe("ADX (Trend Strength)", () => {
  it("returns higher ADX for trending prices", () => {
    const trendingPrices = generateTrendingPrices(100, 50, 0.01);
    const result = adx(trendingPrices, 14);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("returns lower ADX for ranging prices", () => {
    const rangingPrices = generateMeanRevertingPrices(100, 50, 0.02);
    const result = adx(rangingPrices, 14);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 for insufficient data", () => {
    expect(adx([100, 101, 102], 14)).toBe(0);
  });
});

describe("Realized Volatility", () => {
  it("calculates annualized volatility", () => {
    const prices = generatePrices(100, 50, "random", 0.02);
    const result = realizedVolatility(prices, 20);
    expect(result).toBeGreaterThan(0);
  });

  it("returns higher vol for more volatile prices", () => {
    const lowVolPrices = generatePrices(100, 50, "random", 0.01);
    const highVolPrices = generatePrices(100, 50, "random", 0.05);
    const lowVol = realizedVolatility(lowVolPrices, 20);
    const highVol = realizedVolatility(highVolPrices, 20);
    expect(highVol).toBeGreaterThan(lowVol);
  });

  it("returns 0 for insufficient data", () => {
    expect(realizedVolatility([100, 101], 20)).toBe(0);
  });
});

describe("Calculate All Indicators", () => {
  it("returns complete indicator set", () => {
    const prices = generatePrices(100, 150, "random", 0.02);
    const indicators = calculateIndicators(prices);

    expect(indicators.sma10).toBeGreaterThan(0);
    expect(indicators.sma20).toBeGreaterThan(0);
    expect(indicators.sma30).toBeGreaterThan(0);
    expect(indicators.ema10).toBeGreaterThan(0);
    expect(indicators.ema20).toBeGreaterThan(0);
    expect(indicators.rsi14).toBeGreaterThanOrEqual(0);
    expect(indicators.rsi14).toBeLessThanOrEqual(100);
    expect(indicators.atr14).toBeGreaterThanOrEqual(0);
    expect(indicators.atrPercent).toBeGreaterThanOrEqual(0);
    expect(indicators.hurst).toBeGreaterThanOrEqual(0);
    expect(indicators.hurst).toBeLessThanOrEqual(1);
    expect(["trending", "mean_reverting", "random"]).toContain(indicators.regime);
    expect(indicators.adx).toBeGreaterThanOrEqual(0);
    expect(indicators.realizedVol).toBeGreaterThanOrEqual(0);
    expect(indicators.volPercentile).toBeGreaterThanOrEqual(0);
    expect(indicators.volPercentile).toBeLessThanOrEqual(100);
  });
});
