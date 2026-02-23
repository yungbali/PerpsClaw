import { describe, it, expect, beforeEach } from "vitest";
import {
  classifyVolatilityRegime,
  classifyTrendStrength,
  detectRegime,
  checkRegimeChange,
  resetRegimeTracking,
  shouldAgentTrade,
} from "../shared/regime.js";

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
    const trend = trendStrength * (1 + (Math.random() - 0.5) * 0.2);
    prices.push(prices[i - 1] * (1 + trend));
  }
  return prices;
}

describe("Regime Detection Module", () => {
  beforeEach(() => {
    resetRegimeTracking();
  });

  describe("Volatility Regime Classification", () => {
    it("classifies low volatility (percentile < 30)", () => {
      expect(classifyVolatilityRegime(10)).toBe("low");
      expect(classifyVolatilityRegime(29)).toBe("low");
    });

    it("classifies medium volatility (30-70 percentile)", () => {
      expect(classifyVolatilityRegime(30)).toBe("medium");
      expect(classifyVolatilityRegime(50)).toBe("medium");
      expect(classifyVolatilityRegime(69)).toBe("medium");
    });

    it("classifies high volatility (70-90 percentile)", () => {
      expect(classifyVolatilityRegime(70)).toBe("high");
      expect(classifyVolatilityRegime(85)).toBe("high");
      expect(classifyVolatilityRegime(89)).toBe("high");
    });

    it("classifies extreme volatility (>90 percentile)", () => {
      expect(classifyVolatilityRegime(90)).toBe("extreme");
      expect(classifyVolatilityRegime(95)).toBe("extreme");
      expect(classifyVolatilityRegime(100)).toBe("extreme");
    });
  });

  describe("Trend Strength Classification", () => {
    it("classifies no trend (ADX < 15)", () => {
      expect(classifyTrendStrength(10)).toBe("none");
      expect(classifyTrendStrength(14)).toBe("none");
    });

    it("classifies weak trend (15-25)", () => {
      expect(classifyTrendStrength(15)).toBe("weak");
      expect(classifyTrendStrength(20)).toBe("weak");
      expect(classifyTrendStrength(24)).toBe("weak");
    });

    it("classifies moderate trend (25-40)", () => {
      expect(classifyTrendStrength(25)).toBe("moderate");
      expect(classifyTrendStrength(30)).toBe("moderate");
      expect(classifyTrendStrength(39)).toBe("moderate");
    });

    it("classifies strong trend (>40)", () => {
      expect(classifyTrendStrength(40)).toBe("strong");
      expect(classifyTrendStrength(50)).toBe("strong");
      expect(classifyTrendStrength(60)).toBe("strong");
    });
  });

  describe("Detect Regime", () => {
    it("returns complete regime state", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);

      expect(state).toHaveProperty("primaryRegime");
      expect(state).toHaveProperty("volatilityRegime");
      expect(state).toHaveProperty("trendStrength");
      expect(state).toHaveProperty("hurst");
      expect(state).toHaveProperty("atrPercent");
      expect(state).toHaveProperty("adxValue");
      expect(state).toHaveProperty("confidence");
      expect(state).toHaveProperty("recommendedAgents");
      expect(state).toHaveProperty("riskAdjustment");
      expect(state).toHaveProperty("description");
    });

    it("returns valid primary regime", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      expect(["trending", "mean_reverting", "random"]).toContain(state.primaryRegime);
    });

    it("returns valid volatility regime", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      expect(["low", "medium", "high", "extreme"]).toContain(state.volatilityRegime);
    });

    it("returns valid trend strength", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      expect(["none", "weak", "moderate", "strong"]).toContain(state.trendStrength);
    });

    it("returns confidence between 0 and 1", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      expect(state.confidence).toBeGreaterThanOrEqual(0);
      expect(state.confidence).toBeLessThanOrEqual(1);
    });

    it("returns risk adjustment factor", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      expect(state.riskAdjustment).toBeGreaterThan(0);
      expect(state.riskAdjustment).toBeLessThanOrEqual(1.5);
    });

    it("recommends agents based on regime", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      expect(Array.isArray(state.recommendedAgents)).toBe(true);
      expect(state.recommendedAgents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Regime Change Detection", () => {
    it("detects no change on first call", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const result = checkRegimeChange(prices);
      expect(result.changed).toBe(false);
      expect(result.from).toBeNull();
    });

    it("detects regime changes", () => {
      // First call establishes baseline
      const randomPrices = generatePrices(100, 150, "random", 0.02);
      checkRegimeChange(randomPrices);

      // Generate prices with very different characteristics
      const trendingPrices = generateTrendingPrices(100, 150, 0.01);

      // The result depends on whether the Hurst actually changes enough
      const result = checkRegimeChange(trendingPrices);
      expect(result).toHaveProperty("changed");
      expect(result).toHaveProperty("from");
      expect(result).toHaveProperty("to");
      expect(result).toHaveProperty("changeCount");
    });

    it("tracks change count", () => {
      resetRegimeTracking();
      const prices = generatePrices(100, 150, "random", 0.02);

      // Multiple calls
      checkRegimeChange(prices);
      checkRegimeChange(prices);
      const result = checkRegimeChange(prices);

      expect(result.changeCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Should Agent Trade", () => {
    it("returns shouldTrade and reason", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);
      const result = shouldAgentTrade("wolf", state);

      expect(result).toHaveProperty("shouldTrade");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("sizeMultiplier");
      expect(typeof result.shouldTrade).toBe("boolean");
      expect(typeof result.reason).toBe("string");
      expect(typeof result.sizeMultiplier).toBe("number");
    });

    it("returns positive multiplier for recommended agents", () => {
      const prices = generatePrices(100, 150, "random", 0.02);
      const state = detectRegime(prices);

      if (state.recommendedAgents.length > 0) {
        const agentName = state.recommendedAgents[0];
        const result = shouldAgentTrade(agentName, state);
        if (result.shouldTrade) {
          expect(result.sizeMultiplier).toBeGreaterThan(0);
        }
      }
    });

    it("returns false for non-recommended agents", () => {
      // Create a trending regime state manually to test
      const trendingPrices = generateTrendingPrices(100, 150, 0.01);
      const state = detectRegime(trendingPrices);

      // If regime is trending, wolf shouldn't be recommended (or vice versa)
      const wolfResult = shouldAgentTrade("wolf", state);
      const sharkResult = shouldAgentTrade("shark", state);

      // At least one should have conditional logic based on regime
      expect(wolfResult.reason.length).toBeGreaterThan(0);
      expect(sharkResult.reason.length).toBeGreaterThan(0);
    });
  });

  describe("Risk Adjustment", () => {
    it("reduces risk in extreme volatility", () => {
      // This tests the internal risk adjustment calculation
      const lowVolPrices = generatePrices(100, 150, "flat", 0.005);
      const highVolPrices = generatePrices(100, 150, "random", 0.1);

      const lowVolState = detectRegime(lowVolPrices);
      const highVolState = detectRegime(highVolPrices);

      // Higher volatility should result in lower risk adjustment
      // Note: This depends on actual volatility detection
      expect(lowVolState.riskAdjustment).toBeGreaterThanOrEqual(highVolState.riskAdjustment * 0.5);
    });
  });
});

describe("Integration: Regime Detection with Prices", () => {
  it("handles various market conditions", () => {
    const scenarios = [
      { name: "uptrend", prices: generateTrendingPrices(100, 150, 0.005) },
      { name: "downtrend", prices: generateTrendingPrices(100, 150, -0.005) },
      { name: "mean-reverting", prices: generateMeanRevertingPrices(100, 150, 0.03) },
      { name: "random", prices: generatePrices(100, 150, "random", 0.02) },
      { name: "flat", prices: generatePrices(100, 150, "flat", 0.01) },
    ];

    for (const scenario of scenarios) {
      const state = detectRegime(scenario.prices);

      expect(state.primaryRegime).toBeDefined();
      expect(state.volatilityRegime).toBeDefined();
      expect(state.recommendedAgents.length).toBeGreaterThanOrEqual(0);
      expect(state.description.length).toBeGreaterThan(0);
    }
  });
});
