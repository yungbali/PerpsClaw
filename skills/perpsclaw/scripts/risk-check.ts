#!/usr/bin/env npx tsx
/**
 * Validate a proposed trade against risk limits.
 * Usage:
 *   npx tsx scripts/risk-check.ts --direction long --size 0.5
 *   npx tsx scripts/risk-check.ts --direction short --size 0.3
 */
import { Command } from "commander";
import {
  getDriftClient,
  getPositionInfo,
  fetchSolPrice,
  output,
  convertToNumber,
  QUOTE_PRECISION,
} from "./lib.js";

const program = new Command();
program
  .requiredOption("--direction <dir>", "Proposed direction: long or short")
  .requiredOption("--size <size>", "Proposed size in SOL", parseFloat);

program.parse();
const opts = program.opts();

async function main() {
  try {
    const client = await getDriftClient();
    const direction = opts.direction as "long" | "short";
    const size = opts.size as number;
    const { price } = await fetchSolPrice();
    const pos = getPositionInfo(client);

    const user = client.getUser();
    const freeCollateral = convertToNumber(
      user.getFreeCollateral(),
      QUOTE_PRECISION
    );

    const maxLeverage = parseFloat(process.env.MAX_LEVERAGE || "3");
    const budget = parseFloat(process.env.BUDGET || "2");
    const stopLossPct = parseFloat(process.env.STOP_LOSS_PCT || "0.05");
    const dailyLossLimit = budget * -0.15;

    const checks: { name: string; pass: boolean; detail: string }[] = [];

    // 1. Position sizing check
    const maxPositionSize = (budget * maxLeverage) / price;
    const totalSize = pos.hasPosition ? pos.size + size : size;
    checks.push({
      name: "position_size",
      pass: totalSize <= maxPositionSize,
      detail: `Proposed total: ${totalSize.toFixed(4)} SOL, max: ${maxPositionSize.toFixed(4)} SOL`,
    });

    // 2. Collateral check
    const requiredMargin = (size * price) / maxLeverage;
    checks.push({
      name: "collateral",
      pass: freeCollateral >= requiredMargin,
      detail: `Required margin: $${requiredMargin.toFixed(2)}, available: $${freeCollateral.toFixed(2)}`,
    });

    // 3. Leverage check
    const effectiveLeverage =
      freeCollateral > 0 ? (totalSize * price) / freeCollateral : Infinity;
    checks.push({
      name: "leverage",
      pass: effectiveLeverage <= maxLeverage,
      detail: `Effective leverage: ${effectiveLeverage.toFixed(2)}x, max: ${maxLeverage}x`,
    });

    // 4. Conflicting direction check
    if (pos.hasPosition) {
      const isConflicting =
        (pos.direction === "long" && direction === "short") ||
        (pos.direction === "short" && direction === "long");
      checks.push({
        name: "direction_conflict",
        pass: !isConflicting,
        detail: isConflicting
          ? `Current position is ${pos.direction}, proposed ${direction}. Use close first.`
          : `Direction consistent with current ${pos.direction} position`,
      });
    }

    // 5. Stop-loss feasibility
    const stopLossDistance = price * stopLossPct;
    const maxLossOnTrade = size * stopLossDistance;
    checks.push({
      name: "stop_loss",
      pass: maxLossOnTrade < freeCollateral * 0.5,
      detail: `Max loss at stop: $${maxLossOnTrade.toFixed(2)}, 50% of free collateral: $${(freeCollateral * 0.5).toFixed(2)}`,
    });

    // 6. Minimum size check
    checks.push({
      name: "minimum_size",
      pass: size >= 0.01,
      detail: `Size: ${size} SOL, minimum: 0.01 SOL`,
    });

    const allPass = checks.every((c) => c.pass);
    const failures = checks.filter((c) => !c.pass);

    output({
      ok: true,
      data: {
        verdict: allPass ? "PASS" : "FAIL",
        direction,
        proposedSize: size,
        proposedSizeUsd: Number((size * price).toFixed(2)),
        currentPrice: Number(price.toFixed(4)),
        checks,
        failures: failures.map((f) => f.detail),
        riskParams: {
          maxLeverage,
          budget,
          stopLossPct,
          dailyLossLimit,
        },
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
