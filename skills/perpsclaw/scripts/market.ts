const PYTH_URL = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";
const SOL_FEED =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

const HISTORY_COUNT = parseInt(process.argv[2] || "50", 10);
const FETCH_DELAY_MS = 200;

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
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function bollingerBands(
  prices: number[],
  period: number,
  stdDevMultiplier: number
) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance =
    slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: Math.round((mean + stdDev * stdDevMultiplier) * 100) / 100,
    middle: Math.round(mean * 100) / 100,
    lower: Math.round((mean - stdDev * stdDevMultiplier) * 100) / 100,
  };
}

async function fetchPrice(): Promise<number> {
  const res = await fetch(
    `${PYTH_URL}/v2/updates/price/latest?ids[]=${SOL_FEED}`
  );
  const data = await res.json();
  const parsed = data.parsed?.[0]?.price;
  return Number(parsed.price) * Math.pow(10, parsed.expo);
}

async function main() {
  const prices: number[] = [];

  for (let i = 0; i < HISTORY_COUNT; i++) {
    prices.push(await fetchPrice());
    if (i < HISTORY_COUNT - 1) {
      await new Promise((r) => setTimeout(r, FETCH_DELAY_MS));
    }
  }

  const currentPrice = prices[prices.length - 1];
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

  console.log(
    JSON.stringify({
      price: r(currentPrice),
      sma10: r(sma10),
      sma30: r(sma30),
      rsi14: r(rsi14),
      bbUpper: bb?.upper ?? null,
      bbMiddle: bb?.middle ?? null,
      bbLower: bb?.lower ?? null,
      trend,
      volatility,
      samplesCollected: prices.length,
    })
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});
