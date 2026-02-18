import {
  DriftClient,
  Wallet,
  initialize,
  getMarketsAndOraclesForSubscription,
  BASE_PRECISION,
  QUOTE_PRECISION,
  convertToNumber,
} from "@drift-labs/sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const SOL_PERP_MARKET_INDEX = 0;
const PYTH_URL = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";
const SOL_FEED =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

function parseArgs() {
  const args = process.argv.slice(2);
  let keyEnvName = "SHARK_PRIVATE_KEY";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--key" && args[i + 1]) keyEnvName = args[i + 1];
  }
  return { keyEnvName };
}

async function main() {
  const { keyEnvName } = parseArgs();
  const privateKey = process.env[keyEnvName];
  if (!privateKey) {
    console.log(JSON.stringify({ error: `${keyEnvName} not set` }));
    process.exit(1);
  }

  const rpcUrl = process.env.SOLANA_RPC_URL!;
  const env = (process.env.NETWORK || "devnet") as "devnet" | "mainnet-beta";

  const priceRes = await fetch(
    `${PYTH_URL}/v2/updates/price/latest?ids[]=${SOL_FEED}`
  );
  const priceData = await priceRes.json();
  const parsed = priceData.parsed?.[0]?.price;
  const solPrice = parsed
    ? Number(parsed.price) * Math.pow(10, parsed.expo)
    : 0;

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

  const user = driftClient.getUser();
  const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);
  const solBalance = await connection.getBalance(wallet.publicKey);
  const spotValue = convertToNumber(
    user.getNetSpotMarketValue(),
    QUOTE_PRECISION
  );

  const result: any = {
    agent: keyEnvName.replace("_PRIVATE_KEY", ""),
    wallet: wallet.publicKey.toBase58(),
    network: env,
    solPrice: Math.round(solPrice * 100) / 100,
    walletSol: Math.round((solBalance / 1e9) * 1000) / 1000,
    driftCollateral: Math.round(spotValue * 100) / 100,
    position: "flat",
    positionSize: 0,
    unrealizedPnl: 0,
  };

  if (position && !position.baseAssetAmount.isZero()) {
    const baseSize = convertToNumber(position.baseAssetAmount, BASE_PRECISION);
    const pnl = convertToNumber(position.quoteAssetAmount, QUOTE_PRECISION);
    result.position = baseSize > 0 ? "long" : "short";
    result.positionSize = Math.round(Math.abs(baseSize) * 10000) / 10000;
    result.unrealizedPnl = Math.round(pnl * 100) / 100;
  }

  console.log(JSON.stringify(result));
  await driftClient.unsubscribe();
  process.exit(0);
}

main().catch((e) => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});
