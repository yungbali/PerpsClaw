import {
  DriftClient,
  Wallet,
  initialize,
  getMarketsAndOraclesForSubscription,
} from "@drift-labs/sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { RPC_URL, NETWORK } from "@/config/rpc";

let driftClientInstance: DriftClient | null = null;

/**
 * Read-only DriftClient for the frontend.
 * Uses a throwaway keypair (no wallet connection needed).
 * WebSocket subscription (avoids batch RPC calls blocked by Helius free tier).
 */
export async function getReadOnlyDriftClient(): Promise<DriftClient> {
  if (driftClientInstance) return driftClientInstance;

  const connection = new Connection(RPC_URL, { commitment: "confirmed" });
  const wallet = new Wallet(Keypair.generate() as any);
  const sdkConfig = initialize({ env: NETWORK });

  const { oracleInfos, perpMarketIndexes } =
    getMarketsAndOraclesForSubscription(NETWORK);

  const programID =
    typeof sdkConfig.DRIFT_PROGRAM_ID === "string"
      ? new PublicKey(sdkConfig.DRIFT_PROGRAM_ID)
      : sdkConfig.DRIFT_PROGRAM_ID;

  const driftClient = new DriftClient({
    connection: connection as any,
    wallet: wallet as any,
    programID: programID as any,
    env: NETWORK,
    perpMarketIndexes,
    oracleInfos,
    accountSubscription: {
      type: "websocket",
    },
  });

  await driftClient.subscribe();
  driftClientInstance = driftClient;
  return driftClient;
}
