import {
  DriftClient,
  Wallet,
  initialize,
  getMarketsAndOraclesForSubscription,
  convertToNumber,
  BASE_PRECISION,
  QUOTE_PRECISION,
} from "@drift-labs/sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fetchSolPrice } from "./lib.js";

const SOL_PERP_MARKET_INDEX = 0;

const AGENTS = [
  { id: "shark", keyEnv: "SHARK_PRIVATE_KEY" },
  { id: "wolf", keyEnv: "WOLF_PRIVATE_KEY" },
  { id: "grid", keyEnv: "GRID_PRIVATE_KEY" },
] as const;

const PYTH_URL = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";
const SOL_FEED =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

async function createDriftClient(privateKey: string): Promise<DriftClient> {
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

  const programID =
    typeof sdkConfig.DRIFT_PROGRAM_ID === "string"
      ? new PublicKey(sdkConfig.DRIFT_PROGRAM_ID)
      : sdkConfig.DRIFT_PROGRAM_ID;

  const client = new DriftClient({
    connection: connection as any,
    wallet: wallet as any,
    programID: programID as any,
    env,
    perpMarketIndexes,
    spotMarketIndexes,
    oracleInfos,
    accountSubscription: { type: "websocket" },
  });

  await client.subscribe();
  await new Promise((r) => setTimeout(r, 2000));
  return client;
}

function getAgentStatus(client: DriftClient) {
  const user = client.getUser();
  const position = user.getPerpPosition(SOL_PERP_MARKET_INDEX);
  const totalCollateral = convertToNumber(
    user.getTotalCollateral(),
    QUOTE_PRECISION
  );
  const freeCollateral = convertToNumber(
    user.getFreeCollateral(),
    QUOTE_PRECISION
  );

  const result: Record<string, unknown> = {
    wallet: client.wallet.publicKey.toBase58(),
    driftCollateral: Math.round(totalCollateral * 100) / 100,
    freeCollateral: Math.round(freeCollateral * 100) / 100,
    position: "flat",
    positionSize: 0,
    entryPrice: 0,
    unrealizedPnl: 0,
  };

  if (position && !position.baseAssetAmount.isZero()) {
    const baseSize = convertToNumber(position.baseAssetAmount, BASE_PRECISION);
    const pnl = convertToNumber(position.quoteAssetAmount, QUOTE_PRECISION);
    const entry =
      convertToNumber(position.quoteEntryAmount.abs(), QUOTE_PRECISION) /
      Math.abs(baseSize || 1);
    result.position = baseSize > 0 ? "long" : "short";
    result.positionSize = Math.round(Math.abs(baseSize) * 10000) / 10000;
    result.entryPrice = Math.round(entry * 100) / 100;
    result.unrealizedPnl = Math.round(pnl * 100) / 100;
  }

  return result;
}

async function fetchMarketData() {
  const prices: number[] = [];
  const count = 50;
  const delay = 200;

  for (let i = 0; i < count; i++) {
    const res = await fetch(
      `${PYTH_URL}/v2/updates/price/latest?ids[]=${SOL_FEED}`
    );
    const data = (await res.json()) as any;
    const parsed = data.parsed?.[0]?.price;
    prices.push(Number(parsed.price) * Math.pow(10, parsed.expo));
    if (i < count - 1) await new Promise((r) => setTimeout(r, delay));
  }

  const price = prices[prices.length - 1];
  const sma10 = sma(prices, 10);
  const sma30 = sma(prices, 30);
  const rsi14 = rsi(prices, 14);
  const bb = bollingerBands(prices, 20, 2);

  let trend = "neutral";
  if (sma10 && sma30) {
    if (sma10 > sma30 * 1.001) trend = "bullish";
    else if (sma10 < sma30 * 0.999) trend = "bearish";
  }

  let volatility = "low";
  if (bb) {
    const bandWidth = (bb.upper - bb.lower) / bb.middle;
    if (bandWidth > 0.03) volatility = "high";
    else if (bandWidth > 0.015) volatility = "medium";
  }

  const r = (n: number | null) =>
    n !== null ? Math.round(n * 100) / 100 : null;

  return {
    price: r(price),
    sma10: r(sma10),
    sma30: r(sma30),
    rsi14: r(rsi14),
    bbUpper: bb?.upper ?? null,
    bbMiddle: bb?.middle ?? null,
    bbLower: bb?.lower ?? null,
    trend,
    volatility,
  };
}

function sma(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(prices: number[], period: number): number | null {
  if (prices.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function bollingerBands(prices: number[], period: number, mult: number) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance =
    slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: Math.round((mean + stdDev * mult) * 100) / 100,
    middle: Math.round(mean * 100) / 100,
    lower: Math.round((mean - stdDev * mult) * 100) / 100,
  };
}

async function main() {
  const reportsDir =
    process.env.REPORTS_DIR || join(process.cwd(), "..", "..", "reports");

  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  console.log("Fetching market data...");
  const market = await fetchMarketData();

  const agents: Record<string, unknown> = {};
  const clients: DriftClient[] = [];

  for (const agent of AGENTS) {
    const pk = process.env[agent.keyEnv];
    if (!pk) {
      console.log(`Skipping ${agent.id}: ${agent.keyEnv} not set`);
      agents[agent.id] = { error: `${agent.keyEnv} not set` };
      continue;
    }

    try {
      console.log(`Fetching ${agent.id} status...`);
      const client = await createDriftClient(pk);
      clients.push(client);

      const solBalance = await client.connection.getBalance(
        client.wallet.publicKey
      );
      const status = getAgentStatus(client);
      agents[agent.id] = {
        ...status,
        walletSol: Math.round((solBalance / 1e9) * 1000) / 1000,
      };
    } catch (err: any) {
      console.error(`Error fetching ${agent.id}:`, err.message);
      agents[agent.id] = { error: err.message };
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    market,
    agents,
  };

  const filename = `report-${Date.now()}.json`;
  const filepath = join(reportsDir, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`Report written: ${filepath}`);
  console.log(JSON.stringify(report, null, 2));

  for (const c of clients) {
    try {
      await c.unsubscribe();
    } catch {}
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Report generation failed:", e.message);
  process.exit(1);
});
