import { describe, it, expect } from "vitest";
import { applyRiskChecks } from "../shared/risk.js";
import { AgentConfig, TradeSignal, StrategyContext } from "../shared/types.js";

const config: AgentConfig = {
  name: "Test",
  budget: 1,
  loopIntervalMs: 30000,
  maxLeverage: 5,
  stopLossPct: 0.05,
  takeProfitPct: 0.10,
  marketIndex: 0,
};

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

describe("Risk Management", () => {
  it("triggers stop-loss at -5%", () => {
    const signal: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    const ctx = makeCtx({
      positionSize: 0.5,
      entryPrice: 200,
      unrealizedPnl: -6, // -6% on 0.5 * 200 = $100 notional
    });

    const result = applyRiskChecks(signal, ctx, config);
    expect(result.direction).toBe("close");
    expect(result.reason).toContain("Stop-loss");
  });

  it("triggers take-profit at +10%", () => {
    const signal: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    const ctx = makeCtx({
      positionSize: 0.5,
      entryPrice: 200,
      unrealizedPnl: 11, // +11% on $100 notional
    });

    const result = applyRiskChecks(signal, ctx, config);
    expect(result.direction).toBe("close");
    expect(result.reason).toContain("Take-profit");
  });

  it("clamps position size to max leverage", () => {
    const signal: TradeSignal = {
      direction: "long",
      size: 100, // Way too large
      confidence: 0.8,
      reason: "Test",
    };

    const ctx = makeCtx({ currentPrice: 200 });
    const result = applyRiskChecks(signal, ctx, config);

    // Max notional = 1 SOL budget * 5x leverage = $5 / $200 = 0.025 SOL
    expect(result.size).toBeLessThanOrEqual(0.025);
  });

  it("blocks trade when no collateral", () => {
    const signal: TradeSignal = {
      direction: "long",
      size: 0.5,
      confidence: 0.8,
      reason: "Test",
    };

    const ctx = makeCtx({ availableCollateral: 0 });
    const result = applyRiskChecks(signal, ctx, config);
    expect(result.direction).toBe("none");
    expect(result.reason).toContain("No collateral");
  });

  it("passes through 'none' signals unchanged", () => {
    const signal: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    const ctx = makeCtx();
    const result = applyRiskChecks(signal, ctx, config);
    expect(result.direction).toBe("none");
  });

  it("passes through 'close' signals unchanged", () => {
    const signal: TradeSignal = {
      direction: "close",
      size: 0.5,
      confidence: 0.8,
      reason: "Strategy close",
    };

    const ctx = makeCtx();
    const result = applyRiskChecks(signal, ctx, config);
    expect(result.direction).toBe("close");
  });
});
