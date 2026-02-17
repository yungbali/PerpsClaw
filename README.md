# PerpsClaw

AI agent perpetual futures arena on Solana. Three autonomous trading agents compete by trading SOL-PERP on [Drift Protocol](https://www.drift.trade/), each with a distinct strategy. A Next.js frontend streams the competition live.

## Agents

| Agent | Strategy | Approach | Leverage | Loop |
|-------|----------|----------|----------|------|
| **Shark** | Momentum | SMA(10)/SMA(30) crossover + 20-candle breakout | 5x | 30s |
| **Wolf** | Mean Reversion | Bollinger Bands(20,2) + RSI(14) | 3x | 45s |
| **Grid** | Grid Trading | 10 levels at 0.5% spacing, partial closes | 2x | 15s |

## Architecture

```
Pyth Hermes (price feed)
        |
   +---------+---------+
   |         |         |
 Shark     Wolf      Grid       <- TypeScript agent processes
   |         |         |
   +---------+---------+
             |
      Drift Protocol             <- Solana on-chain perps
             |
      Next.js Frontend           <- Live arena viewer
```

- **Price feed**: Pyth Hermes WebSocket + REST
- **Trading**: Drift Protocol SDK (WebSocket subscription)
- **RPC**: Helius (free tier works, paid recommended for mainnet)
- **Frontend**: Next.js 14, lightweight-charts v4, Zustand stores

## Project Structure

```
PerpsClaw/
  agents/
    shared/           # Drift client, risk engine, price feed, agent loop
      drift-client.ts # DriftClient factory (WebSocket subscription)
      loop.ts         # Main agent loop (backoff, circuit breaker, cooldown)
      risk.ts         # Stop-loss, take-profit, position sizing, collateral check
      prices.ts       # Pyth REST price fetch + rolling buffer
      types.ts        # AgentConfig, TradeSignal, Strategy, StrategyContext
      logger.ts       # Structured JSON logger
    shark/            # Momentum strategy
    wolf/             # Mean reversion strategy
    grid/             # Grid trading strategy
    tests/            # 23 unit tests (vitest)
  web/
    src/
      app/arena/      # Arena page (main UI)
      components/
        arena/        # TopBar, AgentCard, AgentGrid, BottomPanel, Leaderboard, TradeLog
        charts/       # TradingChart, ChartCanvas (lightweight-charts), ChartControls
      config/         # RPC, agent wallets, market indices
      hooks/          # usePrices (Pyth WS), useAgentPositions (Drift polling)
      lib/
        drift/        # Read-only DriftClient, position fetcher
        prices/       # Pyth client
      stores/         # Zustand: price, agent stats, trade log
  deploy/             # Dockerfiles, docker-compose, wallet scripts
  ROADMAP.md          # Full roadmap: demo -> production -> copy trading
```

## Setup

### Prerequisites

- Node.js 20+
- npm 9+
- Solana CLI (`solana-keygen` for wallet generation)

### Install

```bash
npm install
```

### Environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|----------|-------------|
| `SOLANA_RPC_URL` | Helius RPC URL (get a free key at [helius.dev](https://dev.helius.xyz)) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Same URL (exposed to frontend) |
| `SHARK_PRIVATE_KEY` | Base58-encoded private key for Shark agent |
| `WOLF_PRIVATE_KEY` | Base58-encoded private key for Wolf agent |
| `GRID_PRIVATE_KEY` | Base58-encoded private key for Grid agent |
| `NEXT_PUBLIC_SHARK_WALLET` | Shark wallet public key |
| `NEXT_PUBLIC_WOLF_WALLET` | Wolf wallet public key |
| `NEXT_PUBLIC_GRID_WALLET` | Grid wallet public key |
| `NETWORK` | `devnet` or `mainnet-beta` |

**Important**: The `.env` file must also be symlinked into `web/` for Next.js to read it:

```bash
ln -sf $(pwd)/.env web/.env
```

### Generate Wallets

```bash
solana-keygen new --outfile keypairs/shark.json --no-bip39-passphrase
solana-keygen new --outfile keypairs/wolf.json --no-bip39-passphrase
solana-keygen new --outfile keypairs/grid.json --no-bip39-passphrase
```

Extract base58 private keys for `.env`:

```bash
node -e "const k=require('./keypairs/shark.json');const bs58=require('bs58');console.log(bs58.encode(Buffer.from(k)))"
```

### Fund Wallets (Devnet)

Use https://faucet.solana.com to airdrop 2 SOL to each agent wallet on devnet. The CLI `solana airdrop` is often rate-limited.

After funding, each agent also needs USDC deposited into Drift as margin collateral. On devnet, use the Drift UI at https://app.drift.trade.

## Running

### Frontend

```bash
npm run dev:web
# -> http://localhost:3000
```

### Agents

Each agent runs as a separate process:

```bash
# In separate terminals:
npx dotenv -e .env -- npx tsx agents/shark/index.ts
npx dotenv -e .env -- npx tsx agents/wolf/index.ts
npx dotenv -e .env -- npx tsx agents/grid/index.ts
```

Or use the workspace scripts:

```bash
npm run dev:shark
npm run dev:wolf
npm run dev:grid
```

### Tests

```bash
cd agents && npm test
```

23 tests covering strategy signals, risk checks, and grid behavior.

### Docker

```bash
cd deploy && docker compose up -d
```

Runs all 3 agents + frontend. 256MB memory per container.

## Key Technical Decisions

**Drift SDK type mismatches**: The project uses `as any` casts throughout Drift client initialization. This is because `@drift-labs/sdk` bundles its own `@solana/web3.js` which conflicts with the direct dependency. The casts are on `Connection`, `Keypair`, `PublicKey`, and `programID`. This is a known Drift SDK issue, not a bug.

**WebSocket over BulkAccountLoader**: Both the frontend and agent Drift clients use `type: "websocket"` for account subscription instead of `BulkAccountLoader` polling. Helius free tier blocks batch JSON-RPC requests which `BulkAccountLoader` requires. If you upgrade to Helius paid, you can switch back to polling for more predictable behavior.

**Zustand selector pattern**: The frontend stores use `getState()` outside React and module-level empty arrays (`const EMPTY: never[] = []`) to avoid infinite re-render loops from creating new references in selectors.

**Pyth price feed**: The frontend generates 200 synthetic historical candles on first load (from a single REST price), then streams real ticks via WebSocket with 500ms throttle. The agents use REST-only (`fetchSolPrice()`) for simplicity.

## Risk Management

Built into `agents/shared/loop.ts` and `agents/shared/risk.ts`:

- **Stop-loss / Take-profit**: Per-agent configurable thresholds checked every tick
- **Position sizing**: Clamped to `budget * maxLeverage / currentPrice`
- **Collateral check**: Rejects trades exceeding available collateral
- **Exponential backoff**: On consecutive errors, sleep doubles up to 5 minutes
- **Daily loss circuit breaker**: Agent halts trading if daily realized loss exceeds -15% of budget
- **Trade cooldown**: Minimum 2x loop interval between trades to prevent overtrading

## What's Next

See `ROADMAP.md` for the full plan. Key next steps:

1. **Fund devnet wallets and smoke test agents** (immediate)
2. **Build landing page** at `/` with scroll animations, live stats, agent profiles
3. **Deploy**: Vercel (frontend) + VPS (agents)
4. **Mainnet**: Generate new wallets, fund with real SOL/USDC, upgrade Helius
5. **Copy trading**: Drift delegate authority for mirroring agent trades
6. **Monitoring**: Telegram/Discord webhook for trade notifications

## Stack

- [Drift Protocol](https://www.drift.trade/) - Solana perpetual futures
- [Pyth Network](https://pyth.network/) - Price oracle
- [Helius](https://helius.dev/) - Solana RPC
- [Next.js 14](https://nextjs.org/) - Frontend framework
- [lightweight-charts](https://github.com/nicholasxuu/nicholasxuu.github.io) - Candlestick charting
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Vitest](https://vitest.dev/) - Testing
