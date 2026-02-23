import { Strategy, StrategyContext, TradeSignal } from "../shared/types.js";
import {
  atr,
  hurstExponent,
  classifyRegime,
  realizedVolatility,
} from "../shared/indicators.js";

/**
 * Grid — Enhanced Grid Trading Strategy
 *
 * Original: Sets up 10 levels at 0.5% spacing around a reference price.
 *
 * Enhanced with:
 * - ATR-based grid spacing (adapts to volatility)
 * - Regime filtering (best in ranging/random markets)
 * - Dynamic grid level count based on volatility
 * - Volatility-adjusted position sizing
 * - Liquidation risk awareness
 */

// Default configuration
const DEFAULT_GRID_LEVELS = 10;
const DEFAULT_SIZE_PER_LEVEL = 0.1;
const MIN_GRID_SPACING_PCT = 0.003; // 0.3% minimum
const MAX_GRID_SPACING_PCT = 0.015; // 1.5% maximum

// Grid state
interface GridLevel {
  price: number;
  filled: boolean;
  side: "buy" | "sell";
  atrAtCreation: number;
}

interface GridState {
  levels: GridLevel[];
  referencePrice: number;
  lastPrice: number;
  createdAt: number;
  atrAtCreation: number;
}

let gridState: GridState | null = null;

/**
 * Calculate optimal grid spacing based on ATR
 */
function calculateGridSpacing(currentAtr: number, currentPrice: number): number {
  // Grid spacing as 0.5x ATR (half the expected daily range per level)
  const atrPct = (currentAtr / currentPrice) * 0.5;

  // Clamp to reasonable bounds
  return Math.max(MIN_GRID_SPACING_PCT, Math.min(MAX_GRID_SPACING_PCT, atrPct));
}

/**
 * Calculate number of grid levels based on volatility
 */
function calculateGridLevelCount(volatility: number): number {
  // Low volatility: more levels (tighter grid)
  // High volatility: fewer levels (wider grid)
  if (volatility < 20) return 12;
  if (volatility < 40) return 10;
  if (volatility < 60) return 8;
  return 6; // High volatility: fewer, wider levels
}

/**
 * Initialize or reinitialize the grid
 */
function initGrid(
  centerPrice: number,
  currentAtr: number,
  volatility: number
): GridState {
  const spacing = calculateGridSpacing(currentAtr, centerPrice);
  const levelCount = calculateGridLevelCount(volatility);

  const levels: GridLevel[] = [];

  for (let i = 0; i < levelCount; i++) {
    // Distribute levels evenly above and below center
    const offset = (i - levelCount / 2 + 0.5) * spacing;
    const levelPrice = centerPrice * (1 + offset);

    levels.push({
      price: levelPrice,
      filled: false,
      side: offset < 0 ? "buy" : "sell",
      atrAtCreation: currentAtr,
    });
  }

  // Sort by price ascending
  levels.sort((a, b) => a.price - b.price);

  return {
    levels,
    referencePrice: centerPrice,
    lastPrice: centerPrice,
    createdAt: Date.now(),
    atrAtCreation: currentAtr,
  };
}

/**
 * Check if grid needs reinitialization
 */
function shouldReinitGrid(
  state: GridState,
  currentPrice: number,
  currentAtr: number
): { reinit: boolean; reason: string } {
  // Reinit if price moved too far from reference
  const priceDeviation =
    Math.abs(currentPrice - state.referencePrice) / state.referencePrice;
  if (priceDeviation > 0.05) {
    return {
      reinit: true,
      reason: `Price deviation ${(priceDeviation * 100).toFixed(1)}% from reference`,
    };
  }

  // Reinit if volatility changed significantly
  const atrChange = Math.abs(currentAtr - state.atrAtCreation) / state.atrAtCreation;
  if (atrChange > 0.5) {
    return {
      reinit: true,
      reason: `ATR changed ${(atrChange * 100).toFixed(1)}% since grid creation`,
    };
  }

  // Reinit if grid is too old (6 hours)
  const ageMs = Date.now() - state.createdAt;
  if (ageMs > 6 * 60 * 60 * 1000) {
    return {
      reinit: true,
      reason: "Grid age exceeded 6 hours",
    };
  }

  return { reinit: false, reason: "" };
}

export const gridStrategy: Strategy = {
  name: "Grid Trading (ATR-Adaptive)",

  evaluate(ctx: StrategyContext): TradeSignal {
    const { currentPrice, priceHistory, positionSize } = ctx;
    const none: TradeSignal = {
      direction: "none",
      size: 0,
      confidence: 0,
      reason: "No signal",
    };

    // Need at least 20 data points
    if (priceHistory.length < 20) {
      return { ...none, reason: "Insufficient data (need 20+ candles)" };
    }

    // =========================================================================
    // REGIME FILTERING
    // =========================================================================

    const hurst = ctx.hurst ?? hurstExponent(priceHistory);
    const regime = ctx.regime ?? classifyRegime(hurst);

    // Grid works best in ranging/random markets
    // Avoid in strong trending markets
    if (regime === "trending" && hurst > 0.6) {
      // Close position and pause grid in strong trends
      if (positionSize !== 0) {
        gridState = null; // Clear grid
        return {
          direction: "close",
          size: Math.abs(positionSize),
          confidence: 0.7,
          reason: `Strong trend detected (H=${hurst.toFixed(2)}), closing grid positions`,
        };
      }
      return {
        ...none,
        reason: `Trending regime (H=${hurst.toFixed(2)}), Grid paused`,
      };
    }

    // =========================================================================
    // VOLATILITY AND ATR CALCULATIONS
    // =========================================================================

    const currentAtr = ctx.atr ?? atr(priceHistory, 14);
    const volatility = realizedVolatility(priceHistory, 20);
    const atrPct = (currentAtr / currentPrice) * 100;

    // =========================================================================
    // LIQUIDATION RISK CHECK
    // =========================================================================

    if (ctx.marketData?.liquidationRisk) {
      const liqRisk = ctx.marketData.liquidationRisk;
      if (liqRisk.riskCategory === "extreme" || liqRisk.riskCategory === "high") {
        // Pause grid in high liquidation risk environments
        if (positionSize !== 0) {
          return {
            direction: "close",
            size: Math.abs(positionSize),
            confidence: 0.8,
            reason: `${liqRisk.riskCategory} liquidation risk, closing grid positions`,
          };
        }
        return {
          ...none,
          reason: `${liqRisk.riskCategory} liquidation risk, Grid paused`,
        };
      }
    }

    // =========================================================================
    // GRID INITIALIZATION/REINIT
    // =========================================================================

    if (gridState === null) {
      gridState = initGrid(currentPrice, currentAtr, volatility);
      return {
        ...none,
        reason: `Grid initialized: ${gridState.levels.length} levels, spacing=${(calculateGridSpacing(currentAtr, currentPrice) * 100).toFixed(2)}%`,
      };
    }

    const reinitCheck = shouldReinitGrid(gridState, currentPrice, currentAtr);
    if (reinitCheck.reinit) {
      gridState = initGrid(currentPrice, currentAtr, volatility);
      return {
        ...none,
        reason: `Grid reinitialized: ${reinitCheck.reason}`,
      };
    }

    const prevPrice = gridState.lastPrice;

    // =========================================================================
    // POSITION SIZING
    // =========================================================================

    let sizePerLevel = DEFAULT_SIZE_PER_LEVEL;

    // Adjust for volatility
    if (volatility > 50) {
      sizePerLevel *= 0.7; // High vol = smaller positions
    } else if (volatility < 20) {
      sizePerLevel *= 1.2; // Low vol = can take larger positions
    }

    // Adjust for regime confidence
    if (hurst < 0.45) {
      sizePerLevel *= 1.1; // Mean reverting = grid works better
    }

    // Apply market data multiplier if available
    if (ctx.marketData?.positionMultiplier) {
      sizePerLevel *= ctx.marketData.positionMultiplier;
    }

    // Clamp size
    sizePerLevel = Math.max(0.05, Math.min(0.2, sizePerLevel));

    // =========================================================================
    // GRID LEVEL CROSSING DETECTION
    // =========================================================================

    for (const level of gridState.levels) {
      if (level.filled) continue;

      // Price crossed down through buy level → go long
      if (
        level.side === "buy" &&
        prevPrice > level.price &&
        currentPrice <= level.price
      ) {
        level.filled = true;
        gridState.lastPrice = currentPrice;

        return {
          direction: "long",
          size: sizePerLevel,
          confidence: 0.65,
          reason: `Grid buy at ${level.price.toFixed(2)} (ATR spacing: ${(atrPct / 2).toFixed(2)}%)`,
        };
      }

      // Price crossed up through sell level → reduce/close long, or open short
      if (
        level.side === "sell" &&
        prevPrice < level.price &&
        currentPrice >= level.price
      ) {
        level.filled = true;
        gridState.lastPrice = currentPrice;

        if (positionSize > sizePerLevel * 0.5) {
          // Partial close: reduce long by one grid level amount
          return {
            direction: "close",
            size: sizePerLevel,
            confidence: 0.65,
            reason: `Grid partial sell at ${level.price.toFixed(2)} (reduce ${sizePerLevel.toFixed(3)} SOL)`,
          };
        }
        if (positionSize > 0) {
          // Close remaining small position
          return {
            direction: "close",
            size: positionSize,
            confidence: 0.65,
            reason: `Grid close remaining at ${level.price.toFixed(2)}`,
          };
        }
        // No long position — open short (with caution in grid strategy)
        if (regime !== "trending") {
          return {
            direction: "short",
            size: sizePerLevel * 0.8, // Slightly smaller shorts
            confidence: 0.55,
            reason: `Grid short at ${level.price.toFixed(2)}`,
          };
        }
      }
    }

    // =========================================================================
    // RESET FILLED LEVELS
    // =========================================================================

    // Reset levels that price has moved away from
    const currentSpacing = calculateGridSpacing(currentAtr, currentPrice);
    for (const level of gridState.levels) {
      if (!level.filled) continue;

      const dist = Math.abs(currentPrice - level.price) / level.price;
      if (dist > currentSpacing * 2) {
        level.filled = false;
      }
    }

    gridState.lastPrice = currentPrice;

    // =========================================================================
    // POSITION LIMITS
    // =========================================================================

    // Limit total grid position size (don't accumulate too much)
    const maxGridPosition = sizePerLevel * (gridState.levels.length / 2);
    if (Math.abs(positionSize) > maxGridPosition) {
      return {
        direction: "close",
        size: Math.abs(positionSize) - maxGridPosition * 0.8,
        confidence: 0.6,
        reason: `Grid position limit: reducing from ${positionSize.toFixed(3)} to ${(maxGridPosition * 0.8).toFixed(3)} SOL`,
      };
    }

    return none;
  },
};

// Export function to reset grid state (for testing)
export function resetGridState(): void {
  gridState = null;
}

// Export function to get current grid info (for debugging/display)
export function getGridInfo(): {
  hasGrid: boolean;
  levels?: number;
  referencePrice?: number;
  filledLevels?: number;
} {
  if (!gridState) {
    return { hasGrid: false };
  }

  return {
    hasGrid: true,
    levels: gridState.levels.length,
    referencePrice: gridState.referencePrice,
    filledLevels: gridState.levels.filter((l) => l.filled).length,
  };
}
