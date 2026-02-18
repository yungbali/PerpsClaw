import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { DriftClient, Wallet, initialize, getMarketsAndOraclesForSubscription, QUOTE_SPOT_MARKET_INDEX } from "@drift-labs/sdk";
import { BN } from "@coral-xyz/anchor";
import * as token from "@solana/spl-token";

const SHARK_KEY = process.env.SHARK_PRIVATE_KEY || "";
const WOLF_KEY = process.env.WOLF_PRIVATE_KEY || "";

// Drift devnet USDC mint
const DEVNET_USDC_MINT = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");

async function fundAndDeposit(agentName: string, privateKeyBase58: string) {
  try {
    console.log(`\n=== ${agentName} ===`);

    const bs58 = await import("bs58");
    const keypair = Keypair.fromSecretKey(bs58.default.decode(privateKeyBase58));
    const wallet = new Wallet(keypair as any);
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

    // Check SOL balance
    const solBalance = await connection.getBalance(wallet.publicKey);
    console.log(`SOL: ${(solBalance / 1e9).toFixed(4)}`);

    // Step 1: Get or create USDC token account
    console.log("\nStep 1: Setting up USDC token account...");
    let usdcAccount;
    try {
      usdcAccount = await token.getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        DEVNET_USDC_MINT,
        wallet.publicKey
      );
      console.log(`USDC account: ${usdcAccount.address.toBase58()}`);

      const usdcBalance = await connection.getTokenAccountBalance(usdcAccount.address);
      console.log(`Current USDC: ${usdcBalance.value.uiAmount || 0} USDC`);
    } catch (err: any) {
      console.log(`Error getting USDC account: ${err.message}`);
      return;
    }

    // Step 2: Initialize Drift client
    console.log("\nStep 2: Connecting to Drift...");
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
    console.log("Connected to Drift");

    // Step 3: Try to mint/request devnet USDC
    console.log("\nStep 3: Requesting devnet USDC...");
    try {
      // Check current USDC balance
      const currentBalance = await connection.getTokenAccountBalance(usdcAccount.address);

      if ((currentBalance.value.uiAmount || 0) >= 100) {
        console.log("✅ Already have sufficient USDC");
      } else {
        console.log("⚠️  Attempting to request USDC from faucet...");
        console.log("Note: Devnet faucets may be rate-limited or unavailable.");
        console.log("");
        console.log("Manual alternative:");
        console.log("1. Visit https://faucet.circle.com/usdc/devnet");
        console.log(`2. Enter wallet: ${wallet.publicKey.toBase58()}`);
        console.log("3. Request devnet USDC tokens");
        console.log("");
        console.log("Or visit https://app.drift.trade on devnet to use their faucet");
      }
    } catch (err: any) {
      console.log(`Faucet error: ${err.message}`);
    }

    // Step 4: Deposit USDC into Drift if we have it
    console.log("\nStep 4: Checking Drift collateral...");

    try {
      const user = driftClient.getUser();
      const currentCollateral = user.getTotalCollateral();
      console.log(`Current Drift collateral: $${(currentCollateral.toNumber() / 1e6).toFixed(2)}`);

      if (currentCollateral.toNumber() > 50_000_000) { // > $50
        console.log(`✅ ${agentName} has sufficient collateral to trade!`);
      } else {
        const usdcBalance = await connection.getTokenAccountBalance(usdcAccount.address);
        const availableUsdc = usdcBalance.value.uiAmount || 0;

        if (availableUsdc > 10) {
          console.log(`Depositing ${availableUsdc} USDC into Drift...`);

          const depositAmount = new BN(availableUsdc * 1e6); // Convert to base units
          await driftClient.deposit(
            depositAmount,
            QUOTE_SPOT_MARKET_INDEX,
            usdcAccount.address
          );

          console.log(`✅ Deposited ${availableUsdc} USDC as collateral!`);

          // Wait and check again
          await new Promise(resolve => setTimeout(resolve, 3000));
          const newCollateral = user.getTotalCollateral();
          console.log(`New collateral: $${(newCollateral.toNumber() / 1e6).toFixed(2)}`);
        } else {
          console.log("⚠️  Need USDC tokens before depositing to Drift");
          console.log("Visit https://faucet.circle.com/usdc/devnet or https://app.drift.trade");
        }
      }
    } catch (err: any) {
      console.log(`Collateral check error: ${err.message}`);
    }

    await driftClient.unsubscribe();

  } catch (error: any) {
    console.error(`${agentName} error:`, error.message);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
  }
}

async function main() {
  console.log("=== Automated Devnet Setup ===\n");

  const agents = [
    { name: "Shark", key: SHARK_KEY },
    { name: "Wolf", key: WOLF_KEY },
  ];

  for (const agent of agents) {
    if (agent.key) {
      await fundAndDeposit(agent.name, agent.key);
    }
  }

  console.log("\n=== Summary ===");
  console.log("If you need to manually get USDC:");
  console.log("Option 1: https://faucet.circle.com/usdc/devnet");
  console.log("Option 2: https://app.drift.trade (switch to devnet, use their faucet)");
  console.log("\nAgent wallets:");
  console.log("Shark: 8RFLZNYhMv7gGiU7sQ897vS7mxQupHua7gXk5kuDKfzi");
  console.log("Wolf: Awn9PoLwTStnsFsXxThppv2vjLxPZ9hQinPvxu7MZ4tC");
}

main().catch(console.error);
