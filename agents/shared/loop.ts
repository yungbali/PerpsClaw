import {
  DriftClient,
  PositionDirection,
  BN,
  BASE_PRECISION,
  QUOTE_PRECISION,
  convertToNumber,
  PRICE_PRECISION,
} from "@drift-labs/sdk";
import { AgentConfig, Strategy, StrategyContext } from "./types.js";
import { fetchSolPrice, PriceBuffer, OHLCBuffer } from "./prices.js";
import { applyRiskChecks } from "./risk.js";
import { atrOHLC, atrPercentOHLC } from "./indicators.js";
import { logger } from "./logger.js";
import { SOL_PERP_MARKET_INDEX } from "./drift-client.js";
import { sendTradeNotification, getAgentEmoji } from "./webhook.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPositionInfo(driftClient: DriftClient): {
  positionSize: number;
  entryPrice: number;
  unrealizedPnl: number;
} {
  try {
    const user = driftClient.getUser();
    const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);
    if (!position) {
      return { positionSize: 0, entryPrice: 0, unrealizedPnl: 0 };
    }

    const baseSize = convertToNumber(position.baseAssetAmount, BASE_PRECISION);
    const entryPrice = convertToNumber(
      position.quoteEntryAmount.abs(),
      QUOTE_PRECISION
    ) / Math.abs(baseSize || 1);
    const unrealizedPnl = convertToNumber(
      position.quoteAssetAmount,
      QUOTE_PRECISION
    );

    return { positionSize: baseSize, entryPrice, unrealizedPnl };
  } catch {
    return { positionSize: 0, entryPrice: 0, unrealizedPnl: 0 };
  }
}

async function executeTrade(
  driftClient: DriftClient,
  direction: "long" | "short" | "close",
  size: number
) {
  const user = driftClient.getUser();

  if (direction === "close") {
    const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);
    if (!position || position.baseAssetAmount.isZero()) {
      logger.info("No position to close");
      return;
    }

    // Partial close: if size < current position, reduce via opposite direction
    const currentSize = Math.abs(
      convertToNumber(position.baseAssetAmount, BASE_PRECISION)
    );
    if (size < currentSize * 0.95) {
      // Partial close — open opposite direction for the partial amount
      const isLong = !position.baseAssetAmount.isNeg();
      const closeDirection = isLong
        ? PositionDirection.SHORT
        : PositionDirection.LONG;
      const baseAmount = new BN(Math.floor(size * 1e9));
      await driftClient.openPosition(
        closeDirection,
        baseAmount,
        SOL_PERP_MARKET_INDEX
      );
      logger.info(`Partial close ${size.toFixed(4)} SOL-PERP`);
      return;
    }

    // Full close
    await driftClient.closePosition(SOL_PERP_MARKET_INDEX);
    logger.info("Position fully closed");
    return;
  }

  const baseAmount = new BN(Math.floor(size * 1e9));
  const perpDirection =
    direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT;

  await driftClient.openPosition(
    perpDirection,
    baseAmount,
    SOL_PERP_MARKET_INDEX
  );

  logger.info(`Opened ${direction} ${size.toFixed(4)} SOL-PERP`);
}

// Daily loss tracking
interface DailyTracker {
  date: string;
  realizedPnl: number;
  peakPnl: number;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runAgentLoop(
  driftClient: DriftClient,
  strategy: Strategy,
  config: AgentConfig
) {
  const priceBuffer = new PriceBuffer(200);
  // OHLC buffer: 1-minute candles for accurate ATR calculation
  const ohlcBuffer = new OHLCBuffer(60_000, 100);
  let running = true;
  let consecutiveErrors = 0;
  let lastTradeTime = 0;
  const TRADE_COOLDOWN_MS = config.loopIntervalMs * 2; // At least 2 loops between trades
  const DAILY_LOSS_LIMIT = config.budget * -0.15; // -15% of budget = circuit breaker

  const daily: DailyTracker = {
    date: getTodayStr(),
    realizedPnl: 0,
    peakPnl: 0,
  };

  process.on("SIGINT", () => {
    logger.info("Shutting down...");
    running = false;
  });
  process.on("SIGTERM", () => {
    logger.info("Shutting down...");
    running = false;
  });

  logger.info(`Starting ${config.name} agent loop (${strategy.name})`);
  logger.info(
    `Budget: ${config.budget} SOL | Leverage: ${config.maxLeverage}x | Interval: ${config.loopIntervalMs}ms`
  );
  logger.info(
    `Cooldown: ${TRADE_COOLDOWN_MS}ms | Daily loss limit: $${Math.abs(DAILY_LOSS_LIMIT).toFixed(2)}`
  );

  while (running) {
    try {
      // Reset daily tracker at midnight
      const today = getTodayStr();
      if (daily.date !== today) {
        logger.info(`New day — resetting daily PnL tracker`, {
          previousDay: daily.date,
          finalPnl: daily.realizedPnl.toFixed(2),
        });
        daily.date = today;
        daily.realizedPnl = 0;
        daily.peakPnl = 0;
      }

      // Circuit breaker: stop trading if daily loss exceeds limit
      if (daily.realizedPnl < DAILY_LOSS_LIMIT) {
        logger.warn(`CIRCUIT BREAKER — daily loss $${daily.realizedPnl.toFixed(2)} exceeds limit $${DAILY_LOSS_LIMIT.toFixed(2)}`);
        await sleep(config.loopIntervalMs * 10); // Sleep 10x longer when halted
        continue;
      }

      // 1. Fetch price and update buffers
      const price = await fetchSolPrice();
      const timestamp = Date.now();
      priceBuffer.push(price);
      ohlcBuffer.push(price, timestamp); // Build OHLC candles from samples
      consecutiveErrors = 0; // Reset on success

      // 2. Get current position
      const { positionSize, entryPrice, unrealizedPnl } =
        getPositionInfo(driftClient);

      // Track peak PnL for drawdown detection
      if (unrealizedPnl > daily.peakPnl) {
        daily.peakPnl = unrealizedPnl;
      }

      // 3. Build context
      let availableCollateral = config.budget;
      try {
        const user = driftClient.getUser();
        const totalValue = convertToNumber(
          user.getNetSpotMarketValue(),
          QUOTE_PRECISION
        );
        availableCollateral = Math.max(totalValue, 0);
      } catch {
        // Fall back to config budget
      }

      // Calculate ATR from OHLC candles if we have enough data (more accurate)
      const ohlcCandles = ohlcBuffer.completeCandles;
      const hasOHLC = ohlcCandles.length >= 15; // Need 15 candles for 14-period ATR
      const atrValue = hasOHLC ? atrOHLC(ohlcCandles, 14) : undefined;
      const atrPct = hasOHLC ? atrPercentOHLC(ohlcCandles, 14) : undefined;

      const ctx: StrategyContext = {
        currentPrice: price,
        priceHistory: priceBuffer.prices,
        ohlcHistory: hasOHLC ? ohlcCandles : undefined,
        positionSize,
        entryPrice,
        unrealizedPnl,
        availableCollateral,
        // Pre-calculated ATR from OHLC (more accurate than close-only)
        atr: atrValue,
        atrPercent: atrPct,
      };

      // 4. Evaluate strategy
      const rawSignal = strategy.evaluate(ctx);

      // 5. Apply risk checks
      const signal = applyRiskChecks(rawSignal, ctx, config);

      logger.info(`Tick`, {
        price: price.toFixed(2),
        position: positionSize.toFixed(4),
        pnl: unrealizedPnl.toFixed(2),
        dailyPnl: daily.realizedPnl.toFixed(2),
        signal: signal.direction,
        reason: signal.reason,
      });

      // 6. Execute if needed (with cooldown check)
      const now = Date.now();
      const cooldownOk = now - lastTradeTime > TRADE_COOLDOWN_MS;

      if (signal.direction !== "none" && signal.confidence > 0.5) {
        if (!cooldownOk) {
          logger.info(`Trade cooldown active, skipping ${signal.direction}`);
        } else {
          const prevPnl = unrealizedPnl;
          await executeTrade(driftClient, signal.direction, signal.size);
          lastTradeTime = now;

          // If we closed a position, record realized PnL
          if (signal.direction === "close") {
            daily.realizedPnl += prevPnl;
            logger.info(`Realized PnL: $${prevPnl.toFixed(2)} | Daily total: $${daily.realizedPnl.toFixed(2)}`);
          }

          // Send Discord/Telegram notification
          sendTradeNotification({
            agentName: config.name,
            agentEmoji: getAgentEmoji(config.name),
            action: signal.direction === "long" ? "LONG" : signal.direction === "short" ? "SHORT" : "CLOSE",
            size: signal.size,
            price,
            reason: signal.reason,
            unrealizedPnl,
            dailyPnl: daily.realizedPnl,
          }).catch(() => {}); // Fire and forget
        }
      }
    } catch (err) {
      consecutiveErrors++;
      const backoffMs = Math.min(
        config.loopIntervalMs * Math.pow(2, consecutiveErrors),
        300_000 // Cap at 5 minutes
      );
      logger.error(`Loop error (${consecutiveErrors} consecutive)`, {
        error: err instanceof Error ? err.message : String(err),
        backoffMs,
      });
      await sleep(backoffMs);
      continue; // Skip the normal sleep below
    }

    await sleep(config.loopIntervalMs);
  }

  logger.info("Agent loop stopped", {
    dailyPnl: daily.realizedPnl.toFixed(2),
  });
}
