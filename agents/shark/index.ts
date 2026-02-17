import { createDriftClient } from "../shared/drift-client.js";
import { runAgentLoop } from "../shared/loop.js";
import { logger } from "../shared/logger.js";
import { sharkConfig } from "./config.js";
import { sharkStrategy } from "./strategy.js";

process.env.AGENT_NAME = "shark";

async function main() {
  const privateKey = process.env.SHARK_PRIVATE_KEY;
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const network = (process.env.NETWORK as "devnet" | "mainnet-beta") || "mainnet-beta";

  if (!privateKey) {
    logger.error("SHARK_PRIVATE_KEY not set");
    process.exit(1);
  }

  logger.info("Initializing Shark agent...");
  const driftClient = await createDriftClient(privateKey, rpcUrl, network);

  await runAgentLoop(driftClient, sharkStrategy, sharkConfig);
}

main().catch((err) => {
  logger.error("Fatal", { error: err.message });
  process.exit(1);
});
