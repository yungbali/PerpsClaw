#!/usr/bin/env npx tsx
/**
 * Read current Drift SOL-PERP position, PnL, and margin info.
 * Usage: npx tsx scripts/position.ts
 */
import { getDriftClient, getPositionInfo, fetchSolPrice, output } from "./lib.js";

async function main() {
  try {
    const client = await getDriftClient();
    const pos = getPositionInfo(client);
    const { price } = await fetchSolPrice();

    output({
      ok: true,
      data: {
        hasPosition: pos.hasPosition,
        direction: pos.direction,
        size: Number(pos.size.toFixed(6)),
        sizeUsd: Number((pos.size * price).toFixed(2)),
        entryPrice: Number(pos.entryPrice.toFixed(4)),
        currentPrice: Number(price.toFixed(4)),
        unrealizedPnl: Number(pos.unrealizedPnl.toFixed(4)),
        unrealizedPnlPct: pos.entryPrice > 0
          ? Number(
              (
                ((price - pos.entryPrice) /
                  pos.entryPrice) *
                100 *
                (pos.direction === "long" ? 1 : -1)
              ).toFixed(4)
            )
          : 0,
        marginRatio: Number(pos.marginRatio.toFixed(4)),
        liquidationPrice: Number(pos.liquidationPrice.toFixed(4)),
      },
      timestamp: Date.now(),
    });

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
