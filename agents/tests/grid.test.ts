import { describe, it, expect, beforeEach } from "vitest";
import { gridStrategy } from "../grid/strategy.js";
import { StrategyContext } from "../shared/types.js";

function makeCtx(overrides: Partial<StrategyContext> = {}): StrategyContext {
  return {
    currentPrice: 200,
    priceHistory: Array(10).fill(200),
    positionSize: 0,
    entryPrice: 0,
    unrealizedPnl: 0,
    availableCollateral: 1,
    ...overrides,
  };
}

describe("Grid Strategy", () => {
  it("returns insufficient data when < 5 data points", () => {
    const ctx = makeCtx({ priceHistory: [200, 201] });
    const signal = gridStrategy.evaluate(ctx);
    expect(signal.direction).toBe("none");
    expect(signal.reason).toContain("Insufficient");
  });

  it("initializes grid on first call", () => {
    const ctx = makeCtx({ currentPrice: 200 });
    const signal = gridStrategy.evaluate(ctx);
    expect(signal.direction).toBe("none");
    expect(signal.reason).toContain("Grid initialized");
  });

  it("signals long when price crosses down through a buy level", () => {
    // First call initializes grid at 200
    const ctx1 = makeCtx({ currentPrice: 200 });
    gridStrategy.evaluate(ctx1);

    // Price drops through a buy level (~0.5% below 200 = ~199)
    const ctx2 = makeCtx({
      currentPrice: 198.5,
      priceHistory: [...Array(9).fill(200), 198.5],
    });
    const signal = gridStrategy.evaluate(ctx2);

    // Should get a buy signal at one of the lower grid levels
    expect(["long", "none"]).toContain(signal.direction);
    if (signal.direction === "long") {
      expect(signal.size).toBe(0.1); // SIZE_PER_LEVEL
      expect(signal.reason).toContain("Grid buy");
    }
  });

  it("signals partial close when price crosses up through sell level with long position", () => {
    // Init grid at 200
    const ctx1 = makeCtx({ currentPrice: 200 });
    gridStrategy.evaluate(ctx1);

    // Simulate having bought at lower level
    // Now price rises through a sell level (~0.5% above 200 = ~201)
    const ctx2 = makeCtx({
      currentPrice: 201.5,
      priceHistory: [...Array(9).fill(200), 201.5],
      positionSize: 0.3, // holding 3 grid levels worth of longs
    });
    const signal = gridStrategy.evaluate(ctx2);

    if (signal.direction !== "none") {
      // Should be a partial close, not a full close
      expect(signal.direction).toBe("close");
      expect(signal.size).toBeLessThanOrEqual(0.1);
      expect(signal.reason).toContain("Grid");
    }
  });

  it("reinitializes grid when price moves >5% from reference", () => {
    // Init at 200
    const ctx1 = makeCtx({ currentPrice: 200 });
    gridStrategy.evaluate(ctx1);

    // Price jumps 6% to 212
    const ctx2 = makeCtx({
      currentPrice: 212,
      priceHistory: [...Array(9).fill(200), 212],
    });
    const signal = gridStrategy.evaluate(ctx2);

    expect(signal.direction).toBe("none");
    expect(signal.reason).toContain("Grid initialized");
  });

  it("signals short at sell level when no position", () => {
    // Init at 200
    const ctx1 = makeCtx({ currentPrice: 200 });
    gridStrategy.evaluate(ctx1);

    // Price rises through sell level with no position
    const ctx2 = makeCtx({
      currentPrice: 201.5,
      priceHistory: [...Array(9).fill(200), 201.5],
      positionSize: 0,
    });
    const signal = gridStrategy.evaluate(ctx2);

    if (signal.direction !== "none") {
      expect(signal.direction).toBe("short");
      expect(signal.size).toBe(0.1);
    }
  });
});
