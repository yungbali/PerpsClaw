#!/usr/bin/env npx tsx
/**
 * Execute a SOL-PERP trade on Drift Protocol.
 * Usage:
 *   npx tsx scripts/trade.ts --direction long --size 0.5
 *   npx tsx scripts/trade.ts --direction short --size 0.3
 *   npx tsx scripts/trade.ts --direction close
 *   npx tsx scripts/trade.ts --direction close --size 0.2  (partial close)
 */
import { Command } from "commander";
import {
  getDriftClient,
  getPositionInfo,
  fetchSolPrice,
  output,
  SOL_PERP_MARKET_INDEX,
  PositionDirection,
  BN,
  convertToNumber,
  BASE_PRECISION,
} from "./lib.js";

const program = new Command();
program
  .requiredOption("--direction <dir>", "Trade direction: long, short, or close")
  .option("--size <size>", "Position size in SOL (omit for full close)", parseFloat);

program.parse();
const opts = program.opts();

async function main() {
  try {
    const client = await getDriftClient();
    const direction = opts.direction as "long" | "short" | "close";
    const size = opts.size as number | undefined;

    if (direction === "close") {
      const user = client.getUser();
      const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);

      if (!position || position.baseAssetAmount.isZero()) {
        output({ ok: true, data: { action: "no_position", message: "No position to close" } });
        await client.unsubscribe();
        return;
      }

      const currentSize = Math.abs(
        convertToNumber(position.baseAssetAmount, BASE_PRECISION)
      );

      if (size && size < currentSize * 0.95) {
        // Partial close via opposite direction
        const isLong = !position.baseAssetAmount.isNeg();
        const closeDir = isLong ? PositionDirection.SHORT : PositionDirection.LONG;
        const baseAmount = new BN(Math.floor(size * 1e9));
        await client.openPosition(closeDir, baseAmount, SOL_PERP_MARKET_INDEX);

        const { price } = await fetchSolPrice();
        output({
          ok: true,
          data: {
            action: "partial_close",
            sizeClosed: size,
            remainingSize: Number((currentSize - size).toFixed(6)),
            price: Number(price.toFixed(4)),
          },
          timestamp: Date.now(),
        });
      } else {
        // Full close
        await client.closePosition(SOL_PERP_MARKET_INDEX);
        const { price } = await fetchSolPrice();
        output({
          ok: true,
          data: {
            action: "full_close",
            sizeClosed: currentSize,
            price: Number(price.toFixed(4)),
          },
          timestamp: Date.now(),
        });
      }
    } else {
      // Open or increase position
      if (!size || size <= 0) {
        output({ ok: false, error: "Size required for long/short trades" });
        process.exit(1);
      }

      const baseAmount = new BN(Math.floor(size * 1e9));
      const perpDir =
        direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT;

      await client.openPosition(perpDir, baseAmount, SOL_PERP_MARKET_INDEX);

      const { price } = await fetchSolPrice();
      const newPos = getPositionInfo(client);

      output({
        ok: true,
        data: {
          action: direction,
          size,
          price: Number(price.toFixed(4)),
          newPosition: {
            direction: newPos.direction,
            totalSize: Number(newPos.size.toFixed(6)),
            entryPrice: Number(newPos.entryPrice.toFixed(4)),
          },
        },
        timestamp: Date.now(),
      });
    }

    await client.unsubscribe();
  } catch (err) {
    output({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
