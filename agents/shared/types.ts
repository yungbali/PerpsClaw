import { PublicKey } from "@solana/web3.js";

export interface AgentConfig {
  name: string;
  keypairPath?: string;
  privateKey?: string;
  /** SOL budget for this agent */
  budget: number;
  /** Loop interval in milliseconds */
  loopIntervalMs: number;
  /** Max leverage */
  maxLeverage: number;
  /** Stop loss percentage (0-1) */
  stopLossPct: number;
  /** Take profit percentage (0-1) */
  takeProfitPct: number;
  /** Drift market index for SOL-PERP */
  marketIndex: number;
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
  /** Current position size (positive = long, negative = short) */
  positionSize: number;
  /** Current position entry price */
  entryPrice: number;
  /** Unrealized PnL in USD */
  unrealizedPnl: number;
  /** Available collateral in SOL */
  availableCollateral: number;
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
