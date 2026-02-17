import { Strategy, StrategyContext, TradeSignal } from "../shared/types.js";
import { GRID_LEVELS, GRID_SPACING_PCT, SIZE_PER_LEVEL } from "./config.js";

/**
 * Grid — Grid Trading strategy
 * Sets up 10 levels at 0.5% spacing around a reference price.
 * Buys when price crosses down through a level, sells when crossing up.
 * Uses partial close (opposite direction) instead of full position close.
 */

interface GridLevel {
  price: number;
  filled: boolean;
  side: "buy" | "sell";
}

let gridLevels: GridLevel[] = [];
let referencePrice = 0;
let lastPrice = 0;

function initGrid(centerPrice: number) {
  referencePrice = centerPrice;
  gridLevels = [];

  for (let i = 0; i < GRID_LEVELS; i++) {
    // 5 levels below, 5 levels above
    const offset = (i - GRID_LEVELS / 2) * GRID_SPACING_PCT;
    const levelPrice = centerPrice * (1 + offset);
    gridLevels.push({
      price: levelPrice,
      filled: false,
      side: offset < 0 ? "buy" : "sell",
    });
  }

  gridLevels.sort((a, b) => a.price - b.price);
}

export const gridStrategy: Strategy = {
  name: "Grid Trading",

  evaluate(ctx: StrategyContext): TradeSignal {
    const { currentPrice, priceHistory, positionSize } = ctx;
    const none: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    if (priceHistory.length < 5) {
      return { ...none, reason: "Insufficient data" };
    }

    // Initialize grid on first run or if price moved >5% from reference
    if (
      gridLevels.length === 0 ||
      Math.abs(currentPrice - referencePrice) / referencePrice > 0.05
    ) {
      initGrid(currentPrice);
      lastPrice = currentPrice;
      return { ...none, reason: "Grid initialized" };
    }

    const prevPrice = lastPrice || priceHistory[priceHistory.length - 2] || currentPrice;

    // Check each grid level for crosses
    for (const level of gridLevels) {
      if (level.filled) continue;

      // Price crossed down through buy level → go long
      if (level.side === "buy" && prevPrice > level.price && currentPrice <= level.price) {
        level.filled = true;
        lastPrice = currentPrice;
        return {
          direction: "long",
          size: SIZE_PER_LEVEL,
          confidence: 0.7,
          reason: `Grid buy at ${level.price.toFixed(2)}`,
        };
      }

      // Price crossed up through sell level → reduce/close long, or open short
      if (level.side === "sell" && prevPrice < level.price && currentPrice >= level.price) {
        level.filled = true;
        lastPrice = currentPrice;

        if (positionSize > SIZE_PER_LEVEL * 0.5) {
          // Partial close: reduce long by one grid level amount
          return {
            direction: "close",
            size: SIZE_PER_LEVEL,
            confidence: 0.7,
            reason: `Grid partial sell at ${level.price.toFixed(2)} (reduce ${SIZE_PER_LEVEL} SOL)`,
          };
        }
        if (positionSize > 0) {
          // Close remaining small position
          return {
            direction: "close",
            size: positionSize,
            confidence: 0.7,
            reason: `Grid close remaining at ${level.price.toFixed(2)}`,
          };
        }
        // No long position — open short
        return {
          direction: "short",
          size: SIZE_PER_LEVEL,
          confidence: 0.6,
          reason: `Grid short at ${level.price.toFixed(2)}`,
        };
      }
    }

    // Reset filled levels that price has moved away from
    for (const level of gridLevels) {
      if (!level.filled) continue;
      const dist = Math.abs(currentPrice - level.price) / level.price;
      if (dist > GRID_SPACING_PCT * 2) {
        level.filled = false;
      }
    }

    lastPrice = currentPrice;
    return none;
  },
};
