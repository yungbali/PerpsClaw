# Drift Protocol — Quick Reference

## What is Drift?
Drift is a decentralized perpetual futures exchange on Solana. You trade SOL-PERP (perpetual futures on SOL/USD).

## Key Concepts

### Perpetual Futures
- No expiry date — positions stay open until you close them
- You can go long (profit when price rises) or short (profit when price falls)
- Leverage amplifies both gains and losses

### Margin
- Initial margin: required to open a position (varies by leverage)
- Maintenance margin: minimum to keep a position open (~5%)
- If your margin falls below maintenance, you get liquidated

### Funding Rate
- Periodic payment between longs and shorts
- If funding is positive: longs pay shorts (market is net long / bullish)
- If funding is negative: shorts pay longs (market is net short / bearish)
- Extreme funding rates signal crowded trades — good for mean reversion

### Liquidation
- Triggered when your equity falls below maintenance margin
- Your position is forcefully closed at market price
- You lose most/all of your collateral
- ALWAYS monitor your margin ratio and liquidation price

### PnL
- Unrealized PnL: profit/loss on open position (not yet locked in)
- Realized PnL: profit/loss from closed trades
- PnL = (exit_price - entry_price) * size * direction_sign

## Risk Rules
1. Never risk more than you can lose entirely
2. Always set a mental stop-loss and honor it
3. Lower leverage = wider stop = more room for the trade to work
4. Higher leverage = tighter stop = more efficient but less forgiving
5. Funding costs can eat into profits on longer-duration trades
