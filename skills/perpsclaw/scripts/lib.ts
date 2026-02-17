import {
  DriftClient,
  Wallet,
  initialize,
  getMarketsAndOraclesForSubscription,
  convertToNumber,
  BASE_PRECISION,
  QUOTE_PRECISION,
  PRICE_PRECISION,
  PositionDirection,
  BN,
} from "@drift-labs/sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export const SOL_PERP_MARKET_INDEX = 0;

const PYTH_HERMES_URL =
  process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";
const SOL_PYTH_FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

let _client: DriftClient | null = null;

export function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    output({ ok: false, error: `Missing env var: ${key}` });
    process.exit(1);
  }
  return val;
}

export function output(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export async function getDriftClient(): Promise<DriftClient> {
  if (_client) return _client;

  const rpcUrl = getEnv("SOLANA_RPC_URL");
  const privateKey = getEnv("AGENT_PRIVATE_KEY");
  const network = (process.env.NETWORK || "devnet") as
    | "devnet"
    | "mainnet-beta";

  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const wallet = new Wallet(keypair as any);
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: rpcUrl.replace("https", "wss"),
  });

  const sdkConfig = initialize({ env: network });
  const { oracleInfos, perpMarketIndexes } =
    getMarketsAndOraclesForSubscription(network);

  const programID =
    typeof sdkConfig.DRIFT_PROGRAM_ID === "string"
      ? new PublicKey(sdkConfig.DRIFT_PROGRAM_ID)
      : sdkConfig.DRIFT_PROGRAM_ID;

  const client = new DriftClient({
    connection: connection as any,
    wallet: wallet as any,
    programID: programID as any,
    env: network,
    perpMarketIndexes,
    oracleInfos,
    accountSubscription: { type: "websocket" },
  });

  await client.subscribe();
  _client = client;
  return client;
}

export async function fetchSolPrice(): Promise<{
  price: number;
  confidence: number;
  timestamp: number;
}> {
  const url = `${PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${SOL_PYTH_FEED_ID}`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  const parsed = data.parsed?.[0]?.price;
  if (!parsed) throw new Error("Failed to fetch SOL price from Pyth");

  const price =
    Number(parsed.price) * Math.pow(10, Number(parsed.expo));
  const confidence =
    Number(parsed.conf) * Math.pow(10, Number(parsed.expo));

  return { price, confidence, timestamp: Date.now() };
}

export async function fetchPriceHistory(
  periods: number = 50
): Promise<{ time: number; price: number }[]> {
  // Fetch current price and generate synthetic history
  // In production, replace with historical candle API
  const { price } = await fetchSolPrice();
  const history: { time: number; price: number }[] = [];
  const now = Date.now();

  for (let i = periods; i > 0; i--) {
    const noise = (Math.random() - 0.5) * price * 0.005;
    const drift = (Math.random() - 0.5) * price * 0.001 * i;
    history.push({
      time: now - i * 60_000,
      price: price + noise + drift,
    });
  }
  history.push({ time: now, price });
  return history;
}

export function getPositionInfo(client: DriftClient): {
  hasPosition: boolean;
  direction: "long" | "short" | "none";
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  marginRatio: number;
  liquidationPrice: number;
} {
  try {
    const user = client.getUser();
    const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);

    if (!position || position.baseAssetAmount.isZero()) {
      return {
        hasPosition: false,
        direction: "none",
        size: 0,
        entryPrice: 0,
        unrealizedPnl: 0,
        marginRatio: 0,
        liquidationPrice: 0,
      };
    }

    const baseSize = convertToNumber(
      position.baseAssetAmount,
      BASE_PRECISION
    );
    const entryPrice =
      convertToNumber(
        position.quoteEntryAmount.abs(),
        QUOTE_PRECISION
      ) / Math.abs(baseSize || 1);
    const unrealizedPnl = convertToNumber(
      position.quoteAssetAmount,
      QUOTE_PRECISION
    );

    const totalCollateral = convertToNumber(
      user.getTotalCollateral(),
      QUOTE_PRECISION
    );
    const marginReq = convertToNumber(
      user.getMaintenanceMarginRequirement(),
      QUOTE_PRECISION
    );
    const marginRatio =
      marginReq > 0 ? totalCollateral / marginReq : 0;

    // Rough liquidation price estimate
    const direction = baseSize > 0 ? "long" : "short";
    const maintenanceMarginRate = 0.05;
    let liquidationPrice = 0;
    if (direction === "long") {
      liquidationPrice =
        entryPrice * (1 - totalCollateral / (Math.abs(baseSize) * entryPrice) + maintenanceMarginRate);
    } else {
      liquidationPrice =
        entryPrice * (1 + totalCollateral / (Math.abs(baseSize) * entryPrice) - maintenanceMarginRate);
    }

    return {
      hasPosition: true,
      direction: baseSize > 0 ? "long" : "short",
      size: Math.abs(baseSize),
      entryPrice,
      unrealizedPnl,
      marginRatio,
      liquidationPrice: Math.max(0, liquidationPrice),
    };
  } catch {
    return {
      hasPosition: false,
      direction: "none",
      size: 0,
      entryPrice: 0,
      unrealizedPnl: 0,
      marginRatio: 0,
      liquidationPrice: 0,
    };
  }
}

export { convertToNumber, BASE_PRECISION, QUOTE_PRECISION, PRICE_PRECISION, PositionDirection, BN };
