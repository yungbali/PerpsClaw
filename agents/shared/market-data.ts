/**
 * Crypto Market Data Module
 *
 * Provides crypto-specific market data and signals:
 * - Funding rate analysis
 * - Open interest tracking
 * - Liquidation risk assessment
 * - Market sentiment indicators
 */

import { logger } from "./logger.js";

// ============================================================================
// TYPES
// ============================================================================

export interface FundingRateData {
  /** Current funding rate (as decimal, e.g., 0.0001 = 0.01%) */
  rate: number;
  /** Funding rate as percentage */
  ratePercent: number;
  /** Time until next funding (ms) */
  timeToNextFunding: number;
  /** Predicted next funding rate (if available) */
  predictedRate?: number;
  /** Funding direction: longs pay shorts or vice versa */
  direction: "longs_pay" | "shorts_pay" | "neutral";
  /** Is rate at extreme levels */
  isExtreme: boolean;
  /** Annualized funding rate */
  annualizedRate: number;
}

export interface OpenInterestData {
  /** Current open interest in base asset (SOL) */
  openInterest: number;
  /** Open interest in USD */
  openInterestUsd: number;
  /** 24h change in OI */
  change24h: number;
  /** 24h change percentage */
  change24hPercent: number;
  /** Long/short ratio (if available) */
  longShortRatio?: number;
  /** Is OI at high levels (potential liquidation cascade risk) */
  isElevated: boolean;
}

export interface LiquidationRiskData {
  /** Risk level 0-1 */
  riskLevel: number;
  /** Risk category */
  riskCategory: "low" | "medium" | "high" | "extreme";
  /** Estimated liquidation cascade probability */
  cascadeProbability: number;
  /** Recommended position size multiplier */
  positionSizeMultiplier: number;
  /** Warning message */
  warning?: string;
}

export interface MarketSentiment {
  /** Overall sentiment score (-1 to 1) */
  score: number;
  /** Sentiment category */
  category: "extreme_fear" | "fear" | "neutral" | "greed" | "extreme_greed";
  /** Funding rate component */
  fundingSignal: number;
  /** OI component */
  oiSignal: number;
  /** Price momentum component */
  momentumSignal: number;
}

// ============================================================================
// FUNDING RATE ANALYSIS
// ============================================================================

// Funding rate history for analysis
let fundingRateHistory: { rate: number; timestamp: number }[] = [];
const MAX_FUNDING_HISTORY = 100;

/**
 * Add funding rate to history
 */
export function recordFundingRate(rate: number): void {
  fundingRateHistory.push({ rate, timestamp: Date.now() });
  if (fundingRateHistory.length > MAX_FUNDING_HISTORY) {
    fundingRateHistory.shift();
  }
}

/**
 * Parse and analyze funding rate
 *
 * @param rawRate - Raw funding rate from exchange (e.g., 0.0001)
 * @param fundingIntervalHours - Funding interval in hours (default 8)
 * @returns Analyzed funding rate data
 */
export function analyzeFundingRate(
  rawRate: number,
  fundingIntervalHours: number = 8
): FundingRateData {
  // Record for history
  recordFundingRate(rawRate);

  const ratePercent = rawRate * 100;

  // Determine direction
  let direction: FundingRateData["direction"] = "neutral";
  if (rawRate > 0.00005) direction = "longs_pay"; // Longs pay shorts (bullish sentiment)
  else if (rawRate < -0.00005) direction = "shorts_pay"; // Shorts pay longs (bearish sentiment)

  // Check if extreme (> 0.1% or < -0.1% is significant)
  const isExtreme = Math.abs(rawRate) > 0.001;

  // Annualized rate (funding happens 3x per day for 8h intervals)
  const fundingsPerYear = (365 * 24) / fundingIntervalHours;
  const annualizedRate = rawRate * fundingsPerYear * 100;

  // Calculate time to next funding (approximate)
  const now = new Date();
  const hours = now.getUTCHours();
  const fundingHours = [0, 8, 16]; // UTC funding times
  let nextFunding = fundingHours.find((h) => h > hours);
  if (nextFunding === undefined) nextFunding = 24; // Next day 00:00
  const hoursUntilFunding = nextFunding - hours;
  const timeToNextFunding = hoursUntilFunding * 60 * 60 * 1000;

  return {
    rate: rawRate,
    ratePercent,
    timeToNextFunding,
    direction,
    isExtreme,
    annualizedRate,
  };
}

/**
 * Get funding rate signal for trading
 * Returns bias adjustment based on funding rate
 *
 * @param fundingData - Analyzed funding rate
 * @returns Signal adjustment (-1 to 1, negative = bearish bias, positive = bullish)
 */
export function getFundingRateSignal(fundingData: FundingRateData): number {
  // Extreme positive funding -> crowded longs -> bearish signal
  // Extreme negative funding -> crowded shorts -> bullish signal
  // This is contrarian logic

  if (fundingData.isExtreme) {
    if (fundingData.direction === "longs_pay") {
      return -0.5; // Bearish bias (longs overcrowded)
    }
    if (fundingData.direction === "shorts_pay") {
      return 0.5; // Bullish bias (shorts overcrowded)
    }
  }

  // Non-extreme: mild contrarian signal
  return -fundingData.rate * 100; // Scale to useful range
}

/**
 * Calculate average funding rate over recent history
 */
export function getAverageFundingRate(periods: number = 24): number {
  const recent = fundingRateHistory.slice(-periods);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, r) => sum + r.rate, 0) / recent.length;
}

// ============================================================================
// OPEN INTEREST ANALYSIS
// ============================================================================

let previousOI: number | null = null;
let oiHistory: { oi: number; timestamp: number }[] = [];
const MAX_OI_HISTORY = 100;

/**
 * Record and analyze open interest
 */
export function analyzeOpenInterest(
  currentOI: number,
  currentPrice: number
): OpenInterestData {
  // Record history
  oiHistory.push({ oi: currentOI, timestamp: Date.now() });
  if (oiHistory.length > MAX_OI_HISTORY) {
    oiHistory.shift();
  }

  // Calculate 24h change
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const oldOI = oiHistory.find((o) => o.timestamp >= oneDayAgo)?.oi || currentOI;
  const change24h = currentOI - oldOI;
  const change24hPercent = oldOI > 0 ? (change24h / oldOI) * 100 : 0;

  // Calculate if OI is elevated (above average)
  const avgOI =
    oiHistory.length > 10
      ? oiHistory.slice(-50).reduce((sum, o) => sum + o.oi, 0) /
        Math.min(50, oiHistory.length)
      : currentOI;
  const isElevated = currentOI > avgOI * 1.2;

  previousOI = currentOI;

  return {
    openInterest: currentOI,
    openInterestUsd: currentOI * currentPrice,
    change24h,
    change24hPercent,
    isElevated,
  };
}

/**
 * Get OI-based signal
 * Rising OI + rising price = bullish (new longs entering)
 * Rising OI + falling price = bearish (new shorts entering)
 * Falling OI = positions closing, less conviction
 */
export function getOISignal(
  oiData: OpenInterestData,
  priceChange24h: number
): number {
  // OI expanding with price = confirmation
  // OI expanding against price = potential reversal signal

  if (oiData.change24hPercent > 5) {
    // Significant OI increase
    if (priceChange24h > 0) {
      return 0.3; // Bullish: new longs entering
    } else {
      return -0.3; // Bearish: new shorts entering
    }
  }

  if (oiData.change24hPercent < -5) {
    // OI decreasing = positions closing
    return 0; // Neutral, less conviction in market
  }

  return 0;
}

// ============================================================================
// LIQUIDATION RISK ASSESSMENT
// ============================================================================

/**
 * Assess liquidation cascade risk
 *
 * @param oiData - Open interest data
 * @param fundingData - Funding rate data
 * @param volatility - Current volatility (ATR %)
 * @param avgVolatility - Average volatility
 * @returns Liquidation risk assessment
 */
export function assessLiquidationRisk(
  oiData: OpenInterestData,
  fundingData: FundingRateData,
  volatility: number,
  avgVolatility: number
): LiquidationRiskData {
  let riskScore = 0;

  // High OI increases liquidation risk
  if (oiData.isElevated) {
    riskScore += 0.2;
  }
  if (oiData.change24hPercent > 10) {
    riskScore += 0.15; // Rapid OI buildup
  }

  // Extreme funding = crowded positions = liquidation risk
  if (fundingData.isExtreme) {
    riskScore += 0.25;
  }

  // High volatility increases cascade probability
  if (volatility > avgVolatility * 1.5) {
    riskScore += 0.2;
  }
  if (volatility > avgVolatility * 2) {
    riskScore += 0.2;
  }

  // Clamp to [0, 1]
  riskScore = Math.min(1, Math.max(0, riskScore));

  // Categorize
  let riskCategory: LiquidationRiskData["riskCategory"];
  if (riskScore >= 0.7) riskCategory = "extreme";
  else if (riskScore >= 0.5) riskCategory = "high";
  else if (riskScore >= 0.3) riskCategory = "medium";
  else riskCategory = "low";

  // Position size multiplier (reduce in high risk)
  let positionSizeMultiplier = 1.0;
  if (riskCategory === "extreme") positionSizeMultiplier = 0.25;
  else if (riskCategory === "high") positionSizeMultiplier = 0.5;
  else if (riskCategory === "medium") positionSizeMultiplier = 0.75;

  // Warning message
  let warning: string | undefined;
  if (riskCategory === "extreme") {
    warning =
      "EXTREME liquidation risk - consider closing positions or using minimal size";
  } else if (riskCategory === "high") {
    warning = "HIGH liquidation risk - reduce position sizes and widen stops";
  }

  return {
    riskLevel: riskScore,
    riskCategory,
    cascadeProbability: riskScore * 0.5, // Rough estimate
    positionSizeMultiplier,
    warning,
  };
}

// ============================================================================
// COMPOSITE MARKET SENTIMENT
// ============================================================================

/**
 * Calculate composite market sentiment
 */
export function calculateMarketSentiment(
  fundingData: FundingRateData,
  oiData: OpenInterestData,
  priceChange24h: number,
  rsiValue: number
): MarketSentiment {
  // Funding signal (contrarian)
  const fundingSignal = getFundingRateSignal(fundingData);

  // OI signal
  const oiSignal = getOISignal(oiData, priceChange24h);

  // Momentum signal from RSI
  let momentumSignal = 0;
  if (rsiValue > 70) momentumSignal = 0.5; // Overbought but momentum up
  else if (rsiValue < 30) momentumSignal = -0.5; // Oversold but momentum down
  else momentumSignal = (rsiValue - 50) / 50; // Normalized RSI

  // Composite score (weighted)
  const score =
    fundingSignal * 0.3 + oiSignal * 0.3 + momentumSignal * 0.4;

  // Categorize
  let category: MarketSentiment["category"];
  if (score >= 0.5) category = "extreme_greed";
  else if (score >= 0.2) category = "greed";
  else if (score <= -0.5) category = "extreme_fear";
  else if (score <= -0.2) category = "fear";
  else category = "neutral";

  return {
    score,
    category,
    fundingSignal,
    oiSignal,
    momentumSignal,
  };
}

// ============================================================================
// DRIFT PROTOCOL HELPERS
// ============================================================================

/**
 * Placeholder for Drift funding rate fetch
 * In production, this would call the Drift SDK
 */
export async function fetchDriftFundingRate(
  marketIndex: number = 0
): Promise<number> {
  // This would be replaced with actual Drift SDK call:
  // const market = driftClient.getPerpMarketAccount(marketIndex);
  // return market.amm.lastFundingRate.toNumber() / 1e6;

  logger.debug(`Fetching funding rate for market ${marketIndex}`);

  // Return mock data for now - will be connected to real Drift data
  return 0.0001; // 0.01% mock funding rate
}

/**
 * Placeholder for Drift open interest fetch
 */
export async function fetchDriftOpenInterest(
  marketIndex: number = 0
): Promise<number> {
  // This would be replaced with actual Drift SDK call:
  // const market = driftClient.getPerpMarketAccount(marketIndex);
  // return market.amm.baseAssetAmountLong.add(market.amm.baseAssetAmountShort.abs()).toNumber() / 1e9;

  logger.debug(`Fetching OI for market ${marketIndex}`);

  // Return mock data
  return 1000000; // Mock 1M SOL OI
}

// ============================================================================
// AGGREGATE MARKET DATA
// ============================================================================

export interface AggregateMarketData {
  funding: FundingRateData;
  openInterest: OpenInterestData;
  liquidationRisk: LiquidationRiskData;
  sentiment: MarketSentiment;
  /** Overall trade confidence multiplier (0-1) */
  confidenceMultiplier: number;
  /** Overall position size multiplier (0-1) */
  positionMultiplier: number;
}

/**
 * Get all market data aggregated
 */
export async function getAggregateMarketData(
  currentPrice: number,
  priceChange24h: number,
  rsiValue: number,
  volatility: number,
  avgVolatility: number,
  marketIndex: number = 0
): Promise<AggregateMarketData> {
  // Fetch data
  const rawFundingRate = await fetchDriftFundingRate(marketIndex);
  const rawOI = await fetchDriftOpenInterest(marketIndex);

  // Analyze
  const funding = analyzeFundingRate(rawFundingRate);
  const openInterest = analyzeOpenInterest(rawOI, currentPrice);
  const liquidationRisk = assessLiquidationRisk(
    openInterest,
    funding,
    volatility,
    avgVolatility
  );
  const sentiment = calculateMarketSentiment(
    funding,
    openInterest,
    priceChange24h,
    rsiValue
  );

  // Calculate overall multipliers
  let confidenceMultiplier = 1.0;
  let positionMultiplier = 1.0;

  // Reduce confidence in extreme conditions
  if (liquidationRisk.riskCategory === "extreme") {
    confidenceMultiplier *= 0.5;
  } else if (liquidationRisk.riskCategory === "high") {
    confidenceMultiplier *= 0.7;
  }

  // Apply liquidation risk to position size
  positionMultiplier *= liquidationRisk.positionSizeMultiplier;

  // Reduce in extreme sentiment
  if (
    sentiment.category === "extreme_greed" ||
    sentiment.category === "extreme_fear"
  ) {
    confidenceMultiplier *= 0.8;
    positionMultiplier *= 0.8;
  }

  return {
    funding,
    openInterest,
    liquidationRisk,
    sentiment,
    confidenceMultiplier,
    positionMultiplier,
  };
}
