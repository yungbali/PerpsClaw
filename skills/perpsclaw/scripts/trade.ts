import {
  DriftClient,
  Wallet,
  initialize,
  getMarketsAndOraclesForSubscription,
  PositionDirection,
  BN,
  BASE_PRECISION,
  convertToNumber,
} from "@drift-labs/sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const SOL_PERP_MARKET_INDEX = 0;

function parseArgs() {
  const args = process.argv.slice(2);
  let keyEnvName = "SHARK_PRIVATE_KEY";
  let action = "";
  let size = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--key" && args[i + 1]) keyEnvName = args[i + 1];
    if (args[i] === "--action" && args[i + 1]) action = args[i + 1];
    if (args[i] === "--size" && args[i + 1]) size = parseFloat(args[i + 1]);
  }

  return { keyEnvName, action, size };
}

async function main() {
  const { keyEnvName, action, size } = parseArgs();

  if (!["long", "short", "close"].includes(action)) {
    console.log(
      JSON.stringify({ error: "Invalid action. Use: long, short, close" })
    );
    process.exit(1);
  }

  if ((action === "long" || action === "short") && size <= 0) {
    console.log(JSON.stringify({ error: "Size must be > 0 for long/short" }));
    process.exit(1);
  }

  const privateKey = process.env[keyEnvName];
  if (!privateKey) {
    console.log(JSON.stringify({ error: `${keyEnvName} not set` }));
    process.exit(1);
  }

  const rpcUrl = process.env.SOLANA_RPC_URL!;
  const env = (process.env.NETWORK || "devnet") as "devnet" | "mainnet-beta";

  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const wallet = new Wallet(keypair as any);
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: rpcUrl.replace("https", "wss"),
  });

  const sdkConfig = initialize({ env });
  const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
    getMarketsAndOraclesForSubscription(env);

  const driftClient = new DriftClient({
    connection: connection as any,
    wallet: wallet as any,
    programID: sdkConfig.DRIFT_PROGRAM_ID as any,
    env,
    perpMarketIndexes,
    spotMarketIndexes,
    oracleInfos,
    accountSubscription: { type: "websocket" },
  });

  await driftClient.subscribe();

  let txSig: string;

  if (action === "close") {
    const user = driftClient.getUser();
    const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);
    if (!position || position.baseAssetAmount.isZero()) {
      console.log(JSON.stringify({ success: false, reason: "No position" }));
      await driftClient.unsubscribe();
      process.exit(0);
    }
    txSig = await driftClient.closePosition(SOL_PERP_MARKET_INDEX);
  } else {
    const direction =
      action === "long" ? PositionDirection.LONG : PositionDirection.SHORT;
    const baseAmount = new BN(Math.floor(size * 1e9));
    txSig = await driftClient.openPosition(
      direction,
      baseAmount,
      SOL_PERP_MARKET_INDEX
    );
  }

  console.log(
    JSON.stringify({
      success: true,
      action,
      size: action === "close" ? "all" : size,
      txSig,
    })
  );

  await driftClient.unsubscribe();
  process.exit(0);
}

main().catch((e) => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});
