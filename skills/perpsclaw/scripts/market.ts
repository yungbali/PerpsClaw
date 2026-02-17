#!/usr/bin/env npx tsx
/**
 * Fetch market conditions: funding rate, open interest, volume, long/short ratio.
 * Usage: npx tsx scripts/market.ts
 */
import {
  getDriftClient,
  fetchSolPrice,
  output,
  SOL_PERP_MARKET_INDEX,
  convertToNumber,
  BASE_PRECISION,
  QUOTE_PRECISION,
  PRICE_PRECISION,
} from "./lib.js";

async function main() {
  try {
    const client = await getDriftClient();
    const { price } = await fetchSolPrice();

    const perpMarket = client.getPerpMarketAccount(SOL_PERP_MARKET_INDEX);
    if (!perpMarket) {
      output({ ok: false, error: "Could not load SOL-PERP market account" });
      process.exit(1);
    }

    // Funding rate
    const lastFundingRate = convertToNumber(
      perpMarket.amm.lastFundingRate,
      PRICE_PRECISION
    );
    const lastFundingRateTs = perpMarket.amm.lastFundingRateTs.toNumber();

    // Hourly funding rate as percentage
    const fundingRatePct = lastFundingRate / price * 100;

    // Open interest
    const baseAssetAmountLong = convertToNumber(
      perpMarket.amm.baseAssetAmountLong,
      BASE_PRECISION
    );
    const baseAssetAmountShort = Math.abs(
      convertToNumber(perpMarket.amm.baseAssetAmountShort, BASE_PRECISION)
    );
    const openInterestBase = baseAssetAmountLong + baseAssetAmountShort;
    const openInterestUsd = openInterestBase * price;

    // Long/short ratio
    const longShortRatio =
      baseAssetAmountShort > 0
        ? baseAssetAmountLong / baseAssetAmountShort
        : baseAssetAmountLong > 0
          ? Infinity
          : 1;

    // Volume (cumulative from market)
    const volume24h = convertToNumber(
      perpMarket.amm.totalFee,
      QUOTE_PRECISION
    );

    // Oracle price from AMM
    const oraclePrice = convertToNumber(
      perpMarket.amm.historicalOracleData.lastOraclePrice,
      PRICE_PRECISION
    );

    // Mark price
    const markPrice = convertToNumber(
      perpMarket.amm.lastMarkPriceTwap,
      PRICE_PRECISION
    );

    // Basis (mark vs oracle)
    const basis = markPrice - oraclePrice;
    const basisPct = oraclePrice > 0 ? (basis / oraclePrice) * 100 : 0;

    output({
      ok: true,
      data: {
        market: "SOL-PERP",
        currentPrice: Number(price.toFixed(4)),
        oraclePrice: Number(oraclePrice.toFixed(4)),
        markPrice: Number(markPrice.toFixed(4)),
        funding: {
          lastRate: Number(lastFundingRate.toFixed(8)),
          lastRatePct: Number(fundingRatePct.toFixed(6)),
          direction: lastFundingRate > 0 ? "longs_pay_shorts" : "shorts_pay_longs",
          lastUpdateTimestamp: lastFundingRateTs,
          interpretation:
            lastFundingRate > 0
              ? "Market is net long (bullish sentiment). Longs pay a premium."
              : lastFundingRate < 0
                ? "Market is net short (bearish sentiment). Shorts pay a premium."
                : "Funding is neutral.",
        },
        openInterest: {
          totalBase: Number(openInterestBase.toFixed(4)),
          totalUsd: Number(openInterestUsd.toFixed(2)),
          longsBase: Number(baseAssetAmountLong.toFixed(4)),
          shortsBase: Number(baseAssetAmountShort.toFixed(4)),
          longShortRatio: Number(longShortRatio.toFixed(4)),
          sentiment:
            longShortRatio > 1.2
              ? "bullish_skew"
              : longShortRatio < 0.8
                ? "bearish_skew"
                : "balanced",
        },
        basis: {
          value: Number(basis.toFixed(4)),
          pct: Number(basisPct.toFixed(4)),
          interpretation:
            basisPct > 0.1
              ? "Mark above oracle — bullish pressure"
              : basisPct < -0.1
                ? "Mark below oracle — bearish pressure"
                : "Basis near zero — balanced",
        },
        totalFeesCollected: Number(volume24h.toFixed(2)),
      },
      timestamp: Date.now(),
    });

    await client.unsubscribe();
  } catch (err) {
    output({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
