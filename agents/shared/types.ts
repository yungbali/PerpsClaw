import { PublicKey } from "@solana/web3.js";
import type { MarketRegime } from "./indicators.js";
import type { RegimeState } from "./regime.js";
import type { AggregateMarketData } from "./market-data.js";

// ============================================================================
// OHLC CANDLE DATA
// ============================================================================

/**
 * OHLC Candle - represents price action within a time period.
 * Used for accurate True Range and ATR calculations.
 */
export interface OHLCCandle {
  /** Candle open timestamp (ms) */
  timestamp: number;
  /** Opening price */
  open: number;
  /** Highest price during period */
  high: number;
  /** Lowest price during period */
  low: number;
  /** Closing price */
  close: number;
  /** Whether candle is complete (period ended) */
  complete: boolean;
}

export interface AgentConfig {
  name: string;
  keypairPath?: string;
  privateKey?: string;
  /** USD budget for this agent (notional value of collateral) */
  budget: number;
  /** Loop interval in milliseconds */
  loopIntervalMs: number;
  /** Max leverage */
  maxLeverage: number;
  /** Stop loss percentage (0-1) - used as fallback, ATR-based preferred */
  stopLossPct: number;
  /** Take profit percentage (0-1) - used as fallback, ATR-based preferred */
  takeProfitPct: number;
  /** Market ID to trade (sol, btc, eth) - defaults to sol */
  marketId?: string;
  /** Drift market index (legacy, use marketId instead) */
  marketIndex: number;
  /** ATR multiplier for stop loss (default 2.0) */
  atrStopMultiplier?: number;
  /** ATR multiplier for take profit (default 3.0) */
  atrTakeProfitMultiplier?: number;
  /** Enable adaptive parameters based on volatility */
  useAdaptiveParams?: boolean;
  /** Enable regime-based trading (only trade when regime matches strategy) */
  useRegimeFilter?: boolean;
  /** Historical win rate for Kelly sizing (0-1) */
  winRate?: number;
  /** Average win/loss ratio for Kelly sizing */
  avgWinLossRatio?: number;
}

export interface TradeSignal {
  direction: "long" | "short" | "close" | "none";
  /** Position size in base asset (SOL) */
  size: number;
  /** Confidence 0-1 */
  confidence: number;
  reason: string;
}

export interface StrategyContext {
  currentPrice: number;
  priceHistory: number[];
  /** OHLC candle history for accurate ATR calculation */
  ohlcHistory?: OHLCCandle[];
  /** Current position size (positive = long, negative = short) */
  positionSize: number;
  /** Current position entry price */
  entryPrice: number;
  /** Unrealized PnL in USD */
  unrealizedPnl: number;
  /** Available collateral in SOL */
  availableCollateral: number;
  /** Enhanced: Current ATR value */
  atr?: number;
  /** Enhanced: ATR as percentage of price */
  atrPercent?: number;
  /** Enhanced: Average ATR (30-period) for volatility comparison */
  avgAtr?: number;
  /** Enhanced: Hurst exponent (0-1) */
  hurst?: number;
  /** Enhanced: Market regime classification */
  regime?: MarketRegime;
  /** Enhanced: Full regime state */
  regimeState?: RegimeState;
  /** Enhanced: Aggregate market data (funding, OI, sentiment) */
  marketData?: AggregateMarketData;
  /** Enhanced: RSI value */
  rsi?: number;
  /** Enhanced: ADX value (trend strength) */
  adx?: number;
}

export interface Strategy {
  name: string;
  evaluate(ctx: StrategyContext): TradeSignal;
}

export interface AgentState {
  name: string;
  wallet: PublicKey;
  strategy: string;
  isRunning: boolean;
  lastTradeTime: number;
  totalTrades: number;
  cumulativePnl: number;
}
