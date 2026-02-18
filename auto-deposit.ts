import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { DriftClient, Wallet, initialize, getMarketsAndOraclesForSubscription, QUOTE_SPOT_MARKET_INDEX } from "@drift-labs/sdk";
import { BN } from "@coral-xyz/anchor";
import * as token from "@solana/spl-token";

const SHARK_KEY = process.env.SHARK_PRIVATE_KEY || "";
const WOLF_KEY = process.env.WOLF_PRIVATE_KEY || "";
const DEVNET_USDC_MINT = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");

async function checkAndDeposit(agentName: string, privateKeyBase58: string): Promise<boolean> {
  try {
    const bs58 = await import("bs58");
    const keypair = Keypair.fromSecretKey(bs58.default.decode(privateKeyBase58));
    const wallet = new Wallet(keypair as any);
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Get USDC token account
    const usdcAccount = await token.getAssociatedTokenAddress(
      DEVNET_USDC_MINT,
      wallet.publicKey
    );

    const usdcBalance = await connection.getTokenAccountBalance(usdcAccount);
    const availableUsdc = usdcBalance.value.uiAmount || 0;

    console.log(`${agentName}: ${availableUsdc} USDC`);

    if (availableUsdc < 10) {
      return false; // Not enough to deposit
    }

    // Initialize Drift
    const sdkConfig = initialize({ env: "devnet" });
    const { oracleInfos, perpMarketIndexes } = getMarketsAndOraclesForSubscription("devnet");
    const programID = typeof sdkConfig.DRIFT_PROGRAM_ID === "string"
      ? new PublicKey(sdkConfig.DRIFT_PROGRAM_ID)
      : sdkConfig.DRIFT_PROGRAM_ID;

    const driftClient = new DriftClient({
      connection: connection as any,
      wallet: wallet as any,
      programID: programID as any,
      env: "devnet",
      perpMarketIndexes,
      oracleInfos,
      accountSubscription: {
        type: "websocket",
      },
    });

    await driftClient.subscribe();

    const user = driftClient.getUser();
    const currentCollateral = user.getTotalCollateral();
    const collateralUsd = currentCollateral.toNumber() / 1e6;

    if (collateralUsd > 50) {
      console.log(`${agentName}: ✅ Already has $${collateralUsd.toFixed(2)} collateral`);
      await driftClient.unsubscribe();
      return true;
    }

    // Deposit USDC
    console.log(`${agentName}: Depositing ${availableUsdc} USDC to Drift...`);
    const depositAmount = new BN(Math.floor(availableUsdc * 1e6));

    await driftClient.deposit(
      depositAmount,
      QUOTE_SPOT_MARKET_INDEX,
      usdcAccount
    );

    console.log(`${agentName}: ✅ Deposited! Checking collateral...`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const newCollateral = user.getTotalCollateral();
    const newCollateralUsd = newCollateral.toNumber() / 1e6;
    console.log(`${agentName}: ✅ Collateral: $${newCollateralUsd.toFixed(2)} - READY TO TRADE!`);

    await driftClient.unsubscribe();
    return true;

  } catch (err: any) {
    console.log(`${agentName}: Error - ${err.message}`);
    return false;
  }
}

async function monitor() {
  console.log("=== Auto-Deposit Monitor ===");
  console.log("Monitoring wallets for USDC...");
  console.log("Will automatically deposit to Drift when USDC arrives\n");

  const agents = [
    { name: "Shark", key: SHARK_KEY },
    { name: "Wolf", key: WOLF_KEY },
  ];

  let allReady = false;
  let checkCount = 0;

  while (!allReady && checkCount < 120) { // Monitor for 10 minutes
    checkCount++;
    console.log(`\n[Check ${checkCount}]`);

    let readyCount = 0;

    for (const agent of agents) {
      if (agent.key) {
        const ready = await checkAndDeposit(agent.name, agent.key);
        if (ready) readyCount++;
      }
    }

    if (readyCount === agents.length) {
      allReady = true;
      console.log("\n✅ All agents funded and ready to trade!");
      console.log("Check the agent logs - they should start trading soon!");
      break;
    }

    if (checkCount === 1) {
      console.log("\n📋 While waiting, get USDC from:");
      console.log("https://app.drift.trade (easiest - switch to devnet, use their faucet)");
      console.log("\nWallets:");
      console.log("Shark: 8RFLZNYhMv7gGiU7sQ897vS7mxQupHua7gXk5kuDKfzi");
      console.log("Wolf: Awn9PoLwTStnsFsXxThppv2vjLxPZ9hQinPvxu7MZ4tC");
    }

    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  if (!allReady) {
    console.log("\nMonitoring timeout. Run this script again after getting USDC.");
  }
}

monitor().catch(console.error);
