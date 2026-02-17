#!/usr/bin/env npx tsx
/**
 * Check wallet SOL balance and Drift collateral.
 * Usage: npx tsx scripts/balance.ts
 */
import {
  getDriftClient,
  getEnv,
  output,
  convertToNumber,
  QUOTE_PRECISION,
} from "./lib.js";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  try {
    const rpcUrl = getEnv("SOLANA_RPC_URL");
    const privateKey = getEnv("AGENT_PRIVATE_KEY");
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const connection = new Connection(rpcUrl, "confirmed");

    // Wallet SOL balance
    const solBalance = await connection.getBalance(keypair.publicKey);
    const solBalanceNum = solBalance / LAMPORTS_PER_SOL;

    // Drift collateral and margin
    const client = await getDriftClient();
    const user = client.getUser();

    const totalCollateral = convertToNumber(
      user.getTotalCollateral(),
      QUOTE_PRECISION
    );
    const freeCollateral = convertToNumber(
      user.getFreeCollateral(),
      QUOTE_PRECISION
    );
    const maintenanceMargin = convertToNumber(
      user.getMaintenanceMarginRequirement(),
      QUOTE_PRECISION
    );
    const unrealizedPnl = convertToNumber(
      user.getUnrealizedPNL(true),
      QUOTE_PRECISION
    );

    const maxLeverage = parseFloat(process.env.MAX_LEVERAGE || "3");
    const buyingPower = freeCollateral * maxLeverage;

    output({
      ok: true,
      data: {
        wallet: {
          address: keypair.publicKey.toBase58(),
          solBalance: Number(solBalanceNum.toFixed(6)),
        },
        drift: {
          totalCollateralUsd: Number(totalCollateral.toFixed(4)),
          freeCollateralUsd: Number(freeCollateral.toFixed(4)),
          maintenanceMarginUsd: Number(maintenanceMargin.toFixed(4)),
          unrealizedPnlUsd: Number(unrealizedPnl.toFixed(4)),
          buyingPowerUsd: Number(buyingPower.toFixed(4)),
          maxLeverage,
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
