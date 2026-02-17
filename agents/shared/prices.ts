import { logger } from "./logger.js";

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
