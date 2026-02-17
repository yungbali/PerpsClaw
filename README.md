# PerpsClaw

AI agent perpetual futures arena on Solana. Three autonomous LLM-powered agents compete by trading SOL-PERP on [Drift Protocol](https://www.drift.trade/), each with a distinct personality and trading philosophy. Powered by [OpenClaw](https://openclaw.ai).

## How It Works

Each agent is an OpenClaw instance with:
- A **SOUL.md** defining its personality, trading philosophy, and rules
- The **perpsclaw skill** — CLI tools for reading market data and executing trades on Drift
- A **cron loop** that fires every 15-45 seconds, prompting the agent to analyze and decide

The LLM reads price data, funding rates, position state — then *reasons* about whether to trade. Not hardcoded math. Real AI decision-making.

## Agents

| Agent | Personality | Style | Leverage | Loop |
|-------|-------------|-------|----------|------|
| **Shark** | Aggressive, decisive | Momentum — rides trends, SMA crossovers, breakouts | 5x | 30s |
| **Wolf** | Patient, disciplined | Mean Reversion — buys fear, sells greed, fades extremes | 3x | 45s |
| **Grid** | Systematic, consistent | Grid Trading — profits from oscillation, not direction | 2x | 15s |

## Architecture

```
OpenClaw (LLM agent runtime)
  |
  |-- Shark (SOUL.md + perpsclaw skill)  ← Claude Sonnet, 30s cron
  |-- Wolf  (SOUL.md + perpsclaw skill)  ← Claude Sonnet, 45s cron
  |-- Grid  (SOUL.md + perpsclaw skill)  ← Claude Haiku, 15s cron
  |
  perpsclaw skill scripts:
    price.ts     → Pyth Hermes oracle (price + indicators)
    position.ts  → Drift SDK (position, PnL, margin)
    trade.ts     → Drift SDK (open/close/reduce)
    balance.ts   → Wallet SOL + Drift collateral
    market.ts    → Funding rate, open interest, sentiment
    risk-check.ts→ Validates trade against risk limits
  |
  Drift Protocol (Solana on-chain perps)
  |
  Next.js Frontend (live arena viewer)
```

## Project Structure

```
PerpsClaw/
  skills/perpsclaw/             # OpenClaw skill (the trading toolkit)
    SKILL.md                    # Skill definition with triggers and commands
    scripts/
      lib.ts                    # Shared: Drift client, Pyth, helpers
      price.ts                  # SOL price + SMA, RSI, Bollinger indicators
      position.ts               # Current position, PnL, margin, liquidation
      trade.ts                  # Execute long/short/close on Drift
      balance.ts                # Wallet SOL + Drift collateral + buying power
      market.ts                 # Funding rate, OI, long/short ratio, basis
      risk-check.ts             # Validate trade against all risk limits
    references/
      drift-perps.md            # Drift Protocol reference for the agent
      risk-rules.md             # Risk parameters and decision hierarchy
    package.json
  agents/
    souls/                      # Agent personalities
      shark.md                  # Shark SOUL.md — momentum trader
      wolf.md                   # Wolf SOUL.md — mean reversion trader
      grid.md                   # Grid SOUL.md — grid market maker
    openclaw/                   # OpenClaw instance configs
      shark.json                # Shark openclaw.json (Sonnet, 5x, 5% SL)
      wolf.json                 # Wolf openclaw.json (Sonnet, 3x, 3% SL)
      grid.json                 # Grid openclaw.json (Haiku, 2x, 7% SL)
    shared/                     # Legacy algo strategies (reference/fallback)
    shark/, wolf/, grid/        # Legacy hardcoded strategies
    tests/                      # 23 unit tests (vitest)
  web/                          # Next.js 14 arena frontend
    src/
      app/arena/                # Arena page (main UI)
      components/arena/         # TopBar, AgentCard, Leaderboard, TradeLog
      components/charts/        # TradingChart, ChartCanvas, ChartControls
      config/                   # RPC, agent wallets, market indices
      hooks/                    # usePrices (Pyth WS), useAgentPositions
      lib/drift/                # Read-only DriftClient, position fetcher
      stores/                   # Zustand: price, agent stats, trade log
  deploy/                       # Docker configs (legacy standalone mode)
  ROADMAP.md                    # Business roadmap: demo → production → copy trading
  OPENCLAW_DEPLOY.md            # Full VPS deployment guide with ClawForge
```

## Setup

### Prerequisites

- Node.js 20+
- npm 9+
- OpenClaw (`npm install -g openclaw@latest`)
- Solana CLI (`solana-keygen` for wallet generation)
- Anthropic API key
- Helius RPC key (free at [helius.dev](https://dev.helius.xyz))

### Install

```bash
npm install
cd skills/perpsclaw && npm install
```

### Environment

```bash
cp .env.example .env
ln -sf $(pwd)/.env web/.env
```

Fill in `.env` with Helius RPC URL, agent private keys, wallet pubkeys, and network.

### Generate Wallets

```bash
solana-keygen new --outfile keypairs/shark.json --no-bip39-passphrase
solana-keygen new --outfile keypairs/wolf.json --no-bip39-passphrase
solana-keygen new --outfile keypairs/grid.json --no-bip39-passphrase
```

Extract base58 private keys:
```bash
node -e "const k=require('./keypairs/shark.json');const bs58=require('bs58');console.log(bs58.encode(Buffer.from(k)))"
```

### Fund Wallets (Devnet)

Airdrop 2 SOL each at https://faucet.solana.com, then deposit USDC collateral into Drift at https://app.drift.trade.

## Running with OpenClaw

### 1. Install & start OpenClaw

```bash
openclaw onboard --install-daemon
openclaw gateway --port 18789
```

### 2. Configure an agent

Copy one of the agent configs and its SOUL.md:
```bash
# Example: Shark
cp agents/openclaw/shark.json ~/.openclaw/openclaw.json
cp agents/souls/shark.md ~/.openclaw/SOUL.md
```

Edit `~/.openclaw/openclaw.json` — fill in your Anthropic API key, Helius RPC key, and agent private key.

### 3. Install the skill

```bash
cp -r skills/perpsclaw ~/.openclaw/skills/perpsclaw
cd ~/.openclaw/skills/perpsclaw && npm install
```

### 4. Test manually

Open the OpenClaw web UI at http://localhost:18789 and chat:
```
Check the SOL price and tell me what you think about the market right now.
```
The agent should run `price.ts` and `market.ts`, then reason about conditions.

### 5. Set up the trading cron

```bash
# 30-second loop for Shark
curl -X POST http://localhost:18789/api/cron \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "add",
    "schedule": { "kind": "every", "everyMs": 30000 },
    "sessionTarget": "isolated",
    "payload": {
      "kind": "agentTurn",
      "message": "Trading loop. Check price, check position, analyze conditions, decide whether to trade. Follow your SOUL.md rules."
    }
  }'
```

### 6. Deploy all 3 agents on a VPS

See **OPENCLAW_DEPLOY.md** for full ClawForge deployment (provision 3 OpenClaw instances behind Caddy reverse proxy).

## Running the Frontend

```bash
npm run dev:web
# → http://localhost:3000
```

The frontend reads agent positions from Drift on-chain — it works regardless of whether agents run as OpenClaw instances or legacy standalone processes.

## Running Legacy Agents (standalone, no OpenClaw)

The original hardcoded algo strategies still work as a fallback:
```bash
npx dotenv -e .env -- npx tsx agents/shark/index.ts
npx dotenv -e .env -- npx tsx agents/wolf/index.ts
npx dotenv -e .env -- npx tsx agents/grid/index.ts
```

### Tests

```bash
cd agents && npm test
```

23 tests covering strategy signals, risk checks, and grid behavior.

## Key Technical Decisions

**OpenClaw over hardcoded strategies**: The original agents used fixed SMA/RSI/grid math. The OpenClaw rebuild lets the LLM *reason* about market conditions using the same data. This is real AI trading, not algo trading with an AI label.

**Drift SDK type mismatches**: Uses `as any` casts throughout because `@drift-labs/sdk` bundles its own `@solana/web3.js` version. Known Drift SDK issue.

**WebSocket over BulkAccountLoader**: Helius free tier blocks batch JSON-RPC. Both frontend and skill scripts use WebSocket subscription.

**Skill scripts output JSON**: Every script outputs `{ "ok": true, "data": {...} }` to stdout. The LLM parses this and reasons about it. Errors return `{ "ok": false, "error": "..." }`.

**Model selection**: Sonnet for Shark/Wolf (complex reasoning), Haiku for Grid (simple systematic logic). Keeps API costs ~$50/mo.

## Risk Management

Built into `skills/perpsclaw/scripts/risk-check.ts` and enforced by each agent's SOUL.md:

- **Position sizing**: Clamped to `budget * maxLeverage / currentPrice`
- **Collateral check**: Rejects trades exceeding free collateral
- **Leverage cap**: Per-agent maximum (5x/3x/2x)
- **Stop-loss**: Per-agent thresholds (5%/3%/7%)
- **Daily loss circuit breaker**: -15% of budget halts all trading
- **Direction conflict check**: Must close before reversing
- **SOUL.md rules**: Agent is instructed to NEVER trade without risk-check passing

## Docs

| Document | Purpose |
|----------|---------|
| `README.md` | This file — setup, architecture, running |
| `ROADMAP.md` | Business plan: demo → production → copy trading → revenue |
| `OPENCLAW_DEPLOY.md` | VPS deployment guide with ClawForge |
| `skills/perpsclaw/SKILL.md` | Skill definition (what the agent can do) |
| `agents/souls/*.md` | Agent personalities and trading rules |
| `agents/openclaw/*.json` | Agent instance configurations |

## Stack

- [OpenClaw](https://openclaw.ai) - AI agent runtime
- [Drift Protocol](https://www.drift.trade/) - Solana perpetual futures
- [Pyth Network](https://pyth.network/) - Price oracle
- [Helius](https://helius.dev/) - Solana RPC
- [Next.js 14](https://nextjs.org/) - Frontend
- [lightweight-charts](https://github.com/nicholasxuu/nicholasxuu.github.io) - Charting
- [Zustand](https://github.com/pmndrs/zustand) - State management
