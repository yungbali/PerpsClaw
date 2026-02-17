import {
  getUserAccountPublicKeySync,
  DriftClient,
  convertToNumber,
  BASE_PRECISION,
  QUOTE_PRECISION,
} from "@drift-labs/sdk";
import { PublicKey } from "@solana/web3.js";
import { SOL_PERP_MARKET_INDEX } from "@/config/markets";

export interface AgentPosition {
  baseSize: number; // positive = long, negative = short
  entryPrice: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  leverage: number;
}

export async function fetchAgentPosition(
  driftClient: DriftClient,
  walletAddress: string
): Promise<AgentPosition | null> {
  try {
    const authority = new PublicKey(walletAddress);
    const userAccountKey = getUserAccountPublicKeySync(
      driftClient.program.programId,
      authority
    );

    const userAccount =
      await driftClient.program.account.user.fetch(userAccountKey);
    if (!userAccount) return null;

    const perpPositions = userAccount.perpPositions as any[];
    const solPosition = perpPositions.find(
      (p: any) => p.marketIndex === SOL_PERP_MARKET_INDEX && !p.baseAssetAmount.isZero()
    );

    if (!solPosition) {
      return {
        baseSize: 0,
        entryPrice: 0,
        unrealizedPnl: 0,
        liquidationPrice: 0,
        leverage: 0,
      };
    }

    const baseSize = convertToNumber(solPosition.baseAssetAmount, BASE_PRECISION);
    const quoteEntry = convertToNumber(
      solPosition.quoteEntryAmount.abs(),
      QUOTE_PRECISION
    );
    const entryPrice = Math.abs(baseSize) > 0 ? quoteEntry / Math.abs(baseSize) : 0;
    const unrealizedPnl = convertToNumber(
      solPosition.quoteAssetAmount,
      QUOTE_PRECISION
    );

    // Rough leverage calc
    const totalCollateral = convertToNumber(
      userAccount.totalCollateral || userAccount.netSpotValue || 0,
      QUOTE_PRECISION
    );
    const notional = Math.abs(baseSize) * entryPrice;
    const leverage = totalCollateral > 0 ? notional / totalCollateral : 0;

    return {
      baseSize,
      entryPrice,
      unrealizedPnl,
      liquidationPrice: 0, // TODO: compute from margin requirements
      leverage,
    };
  } catch {
    return null;
  }
}
