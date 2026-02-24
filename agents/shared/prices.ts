import { logger } from "./logger.js";
import type { OHLCCandle } from "./types.js";

const PYTH_HERMES_URL =
  process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";

// SOL/USD Pyth feed ID
const SOL_FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

export async function fetchSolPrice(): Promise<number> {
  const url = `${PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${SOL_FEED_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pyth fetch failed: ${res.status}`);

  const data = await res.json();
  const parsed = data.parsed?.[0];
  if (!parsed?.price) throw new Error("No price data from Pyth");

  const price =
    Number(parsed.price.price) * Math.pow(10, parsed.price.expo);

  return price;
}

/**
 * Maintain a rolling price history buffer for strategy calculations.
 */
export class PriceBuffer {
  private buffer: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  push(price: number) {
    this.buffer.push(price);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  get prices(): number[] {
    return this.buffer;
  }

  get latest(): number {
    return this.buffer[this.buffer.length - 1] || 0;
  }

  get length(): number {
    return this.buffer.length;
  }
}

/**
 * OHLC Buffer - builds candles from price samples.
 *
 * Since Pyth only provides spot prices (no OHLC), we build candles by:
 * - Tracking high/low within each candle period
 * - Closing candles when period ends
 * - Maintaining a rolling buffer of complete candles
 *
 * This provides accurate True Range data for ATR calculations.
 */
export class OHLCBuffer {
  private candles: OHLCCandle[] = [];
  private currentCandle: OHLCCandle | null = null;
  private maxCandles: number;
  private candlePeriodMs: number;

  /**
   * @param candlePeriodMs - Candle period in milliseconds (default: 60000 = 1 minute)
   * @param maxCandles - Maximum candles to keep (default: 100)
   */
  constructor(candlePeriodMs: number = 60_000, maxCandles: number = 100) {
    this.candlePeriodMs = candlePeriodMs;
    this.maxCandles = maxCandles;
  }

  /**
   * Update buffer with a new price sample.
   * Automatically handles candle creation, updates, and rollovers.
   */
  push(price: number, timestamp: number = Date.now()): void {
    const candleStart = Math.floor(timestamp / this.candlePeriodMs) * this.candlePeriodMs;

    // Check if we need to start a new candle
    if (!this.currentCandle || this.currentCandle.timestamp !== candleStart) {
      // Close the previous candle if it exists
      if (this.currentCandle) {
        this.currentCandle.complete = true;
        this.candles.push(this.currentCandle);

        // Trim buffer if needed
        if (this.candles.length > this.maxCandles) {
          this.candles.shift();
        }
      }

      // Start a new candle
      this.currentCandle = {
        timestamp: candleStart,
        open: price,
        high: price,
        low: price,
        close: price,
        complete: false,
      };
    } else {
      // Update current candle
      this.currentCandle.high = Math.max(this.currentCandle.high, price);
      this.currentCandle.low = Math.min(this.currentCandle.low, price);
      this.currentCandle.close = price;
    }
  }

  /**
   * Get all complete candles (excludes current incomplete candle).
   */
  get completeCandles(): OHLCCandle[] {
    return this.candles;
  }

  /**
   * Get all candles including current incomplete one.
   */
  get allCandles(): OHLCCandle[] {
    if (this.currentCandle) {
      return [...this.candles, this.currentCandle];
    }
    return this.candles;
  }

  /**
   * Get the current (potentially incomplete) candle.
   */
  get current(): OHLCCandle | null {
    return this.currentCandle;
  }

  /**
   * Get the most recent complete candle.
   */
  get lastComplete(): OHLCCandle | null {
    return this.candles.length > 0 ? this.candles[this.candles.length - 1] : null;
  }

  /**
   * Get number of complete candles.
   */
  get length(): number {
    return this.candles.length;
  }

  /**
   * Extract close prices from complete candles (for compatibility with existing indicators).
   */
  get closePrices(): number[] {
    return this.candles.map((c) => c.close);
  }
}
