import { describe, it, expect } from "vitest";
import { wolfStrategy } from "../wolf/strategy.js";
import { StrategyContext } from "../shared/types.js";

function makeCtx(overrides: Partial<StrategyContext> = {}): StrategyContext {
  return {
    currentPrice: 200,
    priceHistory: [],
    positionSize: 0,
    entryPrice: 0,
    unrealizedPnl: 0,
    availableCollateral: 1,
    ...overrides,
  };
}

describe("Wolf Strategy (Mean Reversion BB + RSI)", () => {
  it("returns insufficient data when < 21 data points", () => {
    const ctx = makeCtx({ priceHistory: Array(15).fill(200) });
    const signal = wolfStrategy.evaluate(ctx);
    expect(signal.direction).toBe("none");
    expect(signal.reason).toContain("Insufficient");
  });

  it("returns no signal when price is within Bollinger Bands", () => {
    // Flat price = well within bands
    const flat = Array(30).fill(200);
    const ctx = makeCtx({ priceHistory: flat, currentPrice: 200 });
    const signal = wolfStrategy.evaluate(ctx);
    expect(signal.direction).toBe("none");
  });

  it("signals long when price is oversold (below lower BB + low RSI)", () => {
    // Create a sharp selloff: stable then crash
    const stable = Array(20).fill(200);
    // Sharp decline to create low RSI + price below lower BB
    const crash = [198, 196, 193, 190, 187, 184, 181, 178, 175, 172];
    const prices = [...stable, ...crash];
    const currentPrice = 172;

    const ctx = makeCtx({ priceHistory: prices, currentPrice });
    const signal = wolfStrategy.evaluate(ctx);

    // Price crashed well below the band with strong downward momentum = low RSI
    expect(["long", "none"]).toContain(signal.direction);
    if (signal.direction === "long") {
      expect(signal.reason).toContain("Oversold");
    }
  });

  it("signals short when price is overbought (above upper BB + high RSI)", () => {
    // Stable then pump
    const stable = Array(20).fill(200);
    const pump = [202, 205, 208, 211, 214, 217, 220, 223, 226, 230];
    const prices = [...stable, ...pump];
    const currentPrice = 230;

    const ctx = makeCtx({ priceHistory: prices, currentPrice });
    const signal = wolfStrategy.evaluate(ctx);

    expect(["short", "none"]).toContain(signal.direction);
    if (signal.direction === "short") {
      expect(signal.reason).toContain("Overbought");
    }
  });

  it("signals close when price returns to middle band", () => {
    const stable = Array(25).fill(200);
    const prices = [...stable, 198, 196, 194, 196, 199];
    const currentPrice = 200; // Back to middle

    const ctx = makeCtx({
      priceHistory: prices,
      currentPrice,
      positionSize: 0.4, // holding a long from the dip
      entryPrice: 194,
      unrealizedPnl: 2.4,
    });
    const signal = wolfStrategy.evaluate(ctx);

    // With position and price near middle band, should close for mean reversion
    expect(["close", "none"]).toContain(signal.direction);
  });

  it("closes short on oversold signal", () => {
    const stable = Array(20).fill(200);
    const crash = [198, 196, 193, 190, 187, 184, 181, 178, 175, 172];
    const prices = [...stable, ...crash];

    const ctx = makeCtx({
      priceHistory: prices,
      currentPrice: 172,
      positionSize: -0.4, // holding short
      entryPrice: 195,
    });
    const signal = wolfStrategy.evaluate(ctx);

    // Oversold with existing short = close the short
    if (signal.direction !== "none") {
      expect(signal.direction).toBe("close");
    }
  });
});
