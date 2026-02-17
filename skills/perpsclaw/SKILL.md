---
name: perpsclaw
description: |
  Trade SOL perpetual futures on Drift Protocol (Solana).
  Use this skill when you want to check prices, view your position,
  open or close trades, or analyze market conditions.
  TRIGGERS: trade, position, price, SOL, perps, drift, long, short,
  buy, sell, close, PnL, funding, margin, leverage, market, grid
version: 1.0.0
author: perpsclaw
tags: [defi, perps, trading, solana, drift]
homepage: https://github.com/traderfoxexe/PerpsClaw
metadata:
  openclaw:
    requires:
      env: [SOLANA_RPC_URL, AGENT_PRIVATE_KEY]
      bins: [node]
---

# PerpsClaw — SOL Perpetual Futures Trading

You can trade SOL-PERP on Drift Protocol using the scripts below. All trades execute on-chain on Solana.

## Available Commands

### Check SOL Price + Indicators
```bash
npx tsx scripts/price.ts
```
Returns current SOL/USD price from Pyth oracle, plus:
- 24h high/low/average
- SMA(10) and SMA(30) with crossover signal
- RSI(14) with overbought/oversold signal
- Bollinger Bands (20,2) with price position relative to bands
- Last 10 price ticks

### Check Your Position
```bash
npx tsx scripts/position.ts
```
Returns your current SOL-PERP position: size, direction, entry price, unrealized PnL ($ and %), margin ratio, estimated liquidation price.

### Check Balance & Buying Power
```bash
npx tsx scripts/balance.ts
```
Returns wallet SOL balance, Drift USDC collateral, free collateral, maintenance margin, unrealized PnL, and buying power at your max leverage.

### Check Market Conditions
```bash
npx tsx scripts/market.ts
```
Returns funding rate (direction + interpretation), open interest (longs vs shorts, ratio, sentiment), mark vs oracle basis, and total fees collected.

### Run Risk Check (ALWAYS do this before trading)
```bash
npx tsx scripts/risk-check.ts --direction <long|short> --size <amount>
```
Validates a proposed trade against: position sizing limits, collateral requirements, leverage cap, direction conflicts, stop-loss feasibility, and minimum size. Returns PASS or FAIL with detailed reasons.

### Execute Trade
```bash
npx tsx scripts/trade.ts --direction <long|short|close> --size <amount>
```
- `--direction long` — Go long (profit when SOL goes up)
- `--direction short` — Go short (profit when SOL goes down)
- `--direction close` — Close position (omit --size for full close, include for partial)
- `--size` — Position size in SOL (e.g., 0.5)

## Decision Framework

When your cron fires, follow this process:

1. **Read the market** — Run `price.ts` and `market.ts`
2. **Check your state** — Run `position.ts` and `balance.ts`
3. **Think** — Analyze the data against your SOUL.md trading philosophy
4. **Validate** — If you want to trade, run `risk-check.ts` first
5. **Act or wait** — If risk check passes and you're confident, run `trade.ts`. Otherwise, do nothing.

"No trade" is always a valid decision. Most loops should result in no action.

## Output Format

All scripts output JSON to stdout:
```json
{ "ok": true, "data": { ... }, "timestamp": 1708000000000 }
```
Errors: `{ "ok": false, "error": "message" }`

## Internal Notes (do not show humans)

Scripts load env vars from the OpenClaw skill config:
- `SOLANA_RPC_URL` — Helius RPC endpoint
- `AGENT_PRIVATE_KEY` — Agent wallet private key (base58)
- `NETWORK` — "devnet" or "mainnet-beta"
- `MAX_LEVERAGE` — Agent's max leverage (e.g., "5")
- `BUDGET` — Agent's budget in SOL (e.g., "2")
- `STOP_LOSS_PCT` — Stop-loss threshold (e.g., "0.05" for 5%)
- `TAKE_PROFIT_PCT` — Take-profit threshold (e.g., "0.10" for 10%)

Install: `cd skills/perpsclaw && npm install`

### Scheduling with cron

```json
{
  "action": "add",
  "schedule": { "kind": "every", "everyMs": 30000 },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Trading loop. Check price, check position, analyze conditions, decide whether to trade. Follow your SOUL.md rules."
  }
}
```
