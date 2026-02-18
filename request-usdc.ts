import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as token from "@solana/spl-token";

const SHARK_KEY = process.env.SHARK_PRIVATE_KEY || "";
const WOLF_KEY = process.env.WOLF_PRIVATE_KEY || "";
const DEVNET_USDC_MINT = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");

async function requestUSDC(walletAddress: string, walletName: string) {
  console.log(`\n${walletName}:`);
  console.log(`Requesting USDC for ${walletAddress}...`);

  try {
    // Try Circle's USDC faucet API
    const response = await fetch("https://faucet.circle.com/api/faucet/drips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: walletAddress,
        blockchain: "SOL",
        native: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ USDC requested successfully!`);
      console.log(`Transaction:`, data);
      return true;
    } else {
      const error = await response.text();
      console.log(`⚠️  Faucet response: ${response.status} - ${error}`);
      return false;
    }
  } catch (err: any) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const bs58 = await import("bs58");

  console.log("=== Requesting Devnet USDC ===");
  console.log("Attempting to get USDC from Circle's faucet...\n");

  const agents = [
    { name: "Shark", key: SHARK_KEY, address: "8RFLZNYhMv7gGiU7sQ897vS7mxQupHua7gXk5kuDKfzi" },
    { name: "Wolf", key: WOLF_KEY, address: "Awn9PoLwTStnsFsXxThppv2vjLxPZ9hQinPvxu7MZ4tC" },
  ];

  let successCount = 0;

  for (const agent of agents) {
    const success = await requestUSDC(agent.address, agent.name);
    if (success) successCount++;

    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Successfully requested USDC for ${successCount}/${agents.length} agents`);

  if (successCount < agents.length) {
    console.log(`\nManual steps for remaining wallets:`);
    console.log(`1. Visit https://faucet.circle.com/usdc/devnet`);
    console.log(`2. OR visit https://app.drift.trade (switch to devnet)`);
    console.log(`3. Request USDC for:`);
    agents.forEach(agent => {
      console.log(`   ${agent.name}: ${agent.address}`);
    });
  } else {
    console.log(`\nWait 30 seconds, then run the deposit script to move USDC into Drift.`);
  }
}

main().catch(console.error);
