import {
  DriftClient,
  Wallet,
  initialize,
  getMarketsAndOraclesForSubscription,
} from "@drift-labs/sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { logger } from "./logger.js";

const SOL_PERP_MARKET_INDEX = 0;

export async function createDriftClient(
  privateKeyBase58: string,
  rpcUrl: string,
  env: "devnet" | "mainnet-beta" = "mainnet-beta"
): Promise<DriftClient> {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
  const wallet = new Wallet(keypair as any);
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: rpcUrl.replace("https", "wss"),
  });

  const sdkConfig = initialize({ env });

  const { oracleInfos, perpMarketIndexes } =
    getMarketsAndOraclesForSubscription(env);

  const programID =
    typeof sdkConfig.DRIFT_PROGRAM_ID === "string"
      ? new PublicKey(sdkConfig.DRIFT_PROGRAM_ID)
      : sdkConfig.DRIFT_PROGRAM_ID;

  const driftClient = new DriftClient({
    connection: connection as any,
    wallet: wallet as any,
    programID: programID as any,
    env,
    perpMarketIndexes,
    oracleInfos,
    accountSubscription: {
      type: "websocket",
    },
  });

  await driftClient.subscribe();

  // Check if user account exists, if not initialize it
  try {
    await driftClient.getUserAccountsForAuthority(wallet.publicKey);
  } catch {
    logger.info("Initializing Drift user account...");
    await driftClient.initializeUserAccount();
    logger.info("Drift user account initialized");
  }

  logger.info(`DriftClient ready for ${wallet.publicKey.toBase58()}`);
  return driftClient;
}

export { SOL_PERP_MARKET_INDEX };
