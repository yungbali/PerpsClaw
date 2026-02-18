---
name: perpsclaw
description: "PerpsClaw trading agent skill. Check SOL prices, analyze market conditions (SMA, RSI, Bollinger Bands), inspect Drift Protocol positions, and execute SOL-PERP trades. Use when asked about price, market analysis, positions, or trading."
metadata:
  {
    "openclaw":
      {
        "emoji": "🦞",
        "requires": { "bins": ["node", "npx"] },
      },
  }
---

# PerpsClaw Trading Skill

You are a trading agent operating on Drift Protocol (Solana). This skill gives you tools to check prices, analyze markets, manage positions, and execute trades on SOL-PERP.

## Setup

Scripts live in this skill's `scripts/` directory. Run them with `npx tsx`:

```bash
SKILL_DIR="$(dirname "$(realpath "$0")")" # or use the known path
```

All scripts read env vars: `SOLANA_RPC_URL`, `NETWORK`, `AGENT_PRIVATE_KEY` (or the agent-specific key like `SHARK_PRIVATE_KEY`).

The PerpsClaw project root should have a `.env` with these values. Set `PERPS_ENV` and run with the local `tsx`:

```bash
export PERPS_ENV=/path/to/PerpsClaw/.env
SKILL_DIR=~/.openclaw/skills/perpsclaw
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/price.ts
```

## Available Tools

### 1. Check SOL Price

```bash
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/price.ts
```

Returns current SOL/USD price from Pyth Hermes. Output:

```json
{ "price": 82.45, "timestamp": "2026-02-18T16:00:00Z" }
```

### 2. Market Analysis

```bash
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/market.ts [--history 50]
```

Fetches price and computes technical indicators. Output:

```json
{
  "price": 82.45,
  "sma10": 82.30,
  "sma30": 82.50,
  "rsi14": 45.2,
  "bbUpper": 83.10,
  "bbMiddle": 82.40,
  "bbLower": 81.70,
  "trend": "neutral",
  "volatility": "low"
}
```

### 3. Check Position

```bash
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/position.ts --key SHARK_PRIVATE_KEY
```

Returns current Drift perp position for the agent wallet. Output:

```json
{
  "wallet": "8RFLZNYh...",
  "positionSize": 0.5,
  "side": "long",
  "entryPrice": 82.10,
  "unrealizedPnl": 1.25,
  "collateral": 124.50
}
```

### 4. Execute Trade

```bash
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/trade.ts --key SHARK_PRIVATE_KEY --action long --size 0.5
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/trade.ts --key SHARK_PRIVATE_KEY --action close
```

Actions: `long`, `short`, `close`. Size is in SOL. Output:

```json
{ "success": true, "action": "long", "size": 0.5, "txSig": "5Yar..." }
```

### 5. Agent Status

```bash
$SKILL_DIR/node_modules/.bin/tsx --env-file=$PERPS_ENV $SKILL_DIR/scripts/status.ts --key SHARK_PRIVATE_KEY
```

Returns wallet balance, Drift position, and collateral summary.

## Trading Rules (defer to SOUL.md)

The SOUL.md file defines your specific strategy, risk limits, and personality. Always follow SOUL.md rules when deciding whether to trade. These scripts are your tools — SOUL.md is your brain.

## Risk Guardrails

- **Never** open a position larger than your collateral allows
- **Always** check your position before opening a new one
- **Always** respect stop-loss and take-profit levels from SOUL.md
- **Never** trade if collateral is below $10
- If in doubt, do nothing — flat is a valid position
