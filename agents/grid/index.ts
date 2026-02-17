import { createDriftClient } from "../shared/drift-client.js";
import { runAgentLoop } from "../shared/loop.js";
import { logger } from "../shared/logger.js";
import { gridConfig } from "./config.js";
import { gridStrategy } from "./strategy.js";

process.env.AGENT_NAME = "grid";

async function main() {
  const privateKey = process.env.GRID_PRIVATE_KEY;
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const network = (process.env.NETWORK as "devnet" | "mainnet-beta") || "mainnet-beta";

  if (!privateKey) {
    logger.error("GRID_PRIVATE_KEY not set");
    process.exit(1);
  }

  logger.info("Initializing Grid agent...");
  const driftClient = await createDriftClient(privateKey, rpcUrl, network);

  await runAgentLoop(driftClient, gridStrategy, gridConfig);
}

main().catch((err) => {
  logger.error("Fatal", { error: err.message });
  process.exit(1);
});
