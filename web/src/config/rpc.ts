export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export const NETWORK =
  (process.env.NEXT_PUBLIC_NETWORK as "devnet" | "mainnet-beta") || "mainnet-beta";

export const PYTH_HERMES_URL =
  process.env.NEXT_PUBLIC_PYTH_HERMES_URL || "https://hermes.pyth.network";
