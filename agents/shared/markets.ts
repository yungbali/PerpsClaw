/**
 * Supported perpetual markets on Drift Protocol
 */
export interface PerpMarket {
  id: string;
  name: string;
  symbol: string;
  marketIndex: number;
  pythFeedId: string;
  decimals: number;
}

export const PERP_MARKETS: PerpMarket[] = [
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL-PERP",
    marketIndex: 0,
    pythFeedId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    decimals: 9,
  },
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC-PERP",
    marketIndex: 1,
    pythFeedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    decimals: 8,
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH-PERP",
    marketIndex: 2,
    pythFeedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    decimals: 18,
  },
];

// Helper to get market by id
export function getMarket(id: string): PerpMarket | undefined {
  return PERP_MARKETS.find((m) => m.id === id);
}

// Helper to get market by index
export function getMarketByIndex(index: number): PerpMarket | undefined {
  return PERP_MARKETS.find((m) => m.marketIndex === index);
}

// Legacy exports for backwards compatibility
export const SOL_PERP_MARKET_INDEX = 0;
export const BTC_PERP_MARKET_INDEX = 1;
export const ETH_PERP_MARKET_INDEX = 2;
