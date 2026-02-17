# PerpsClaw: Demo to Production Roadmap

## Current State (Feb 17, 2026)

**What exists:**
- 3 AI trading agents (Shark, Wolf, Grid) with distinct strategies
- Next.js frontend ("Command Nexus" theme) with live Pyth price feed, candlestick chart, leaderboard, trade log
- Drift Protocol SDK integration (devnet-ready, mainnet-ready with env swap)
- Helius RPC configured (free tier)
- Agent loop with exponential backoff, circuit breaker, trade cooldown
- 23 passing unit tests
- Docker deployment configs

**What's missing:**
- Agent wallets unfunded (0 SOL each on devnet)
- Agents have never executed a live trade
- No domain, no hosting, no public access
- No social presence or marketing
- No real money deployed

---

## Phase 1: Working Demo (Days 1-3)

### 1.1 Fund Devnet Wallets
Go to https://faucet.solana.com and airdrop 2 SOL to each agent on **Devnet**:
- Shark: `E4B9KJ6wqcYdn2BpQcndsGZBiFTconhCGy3ZuPgfaK7z`
- Wolf: `1EdNfkeB2hU4suQhwxBUfPqV3ZGTsfj8bue26Nsv8bY`
- Grid: `GuePwobEJfpHkFTDfvWr9FwyRoWt6NuDT9eyCY2guu1V`

Each agent needs ~2 SOL: ~0.01 for Drift account init, ~0.5 for tx fees over time, rest as collateral.

### 1.2 Deposit Collateral into Drift (Devnet)
After funding, each agent needs USDC deposited into Drift as collateral. On devnet, Drift has a faucet:
- Navigate to https://app.drift.trade (connect each wallet)
- Or programmatically: call `driftClient.deposit()` with devnet USDC

### 1.3 Smoke Test Agents
```bash
# Terminal 1 - Shark
cd PerpsClaw && npx dotenv -e .env -- npx tsx agents/shark/index.ts

# Terminal 2 - Wolf
cd PerpsClaw && npx dotenv -e .env -- npx tsx agents/wolf/index.ts

# Terminal 3 - Grid
cd PerpsClaw && npx dotenv -e .env -- npx tsx agents/grid/index.ts
```
Watch logs for: successful Drift subscription, price fetches, strategy ticks, first trade execution.

### 1.4 Verify Frontend Reflects Trades
- Run `npm run dev --workspace=web -- -p 3002`
- Open http://localhost:3002/arena
- Confirm agent cards show positions, PnL updates, trade log populates

**Milestone: All 3 agents trading on devnet, frontend reflecting live state.**

---

## Phase 2: Million-Dollar Website (Days 3-7)

### 2.1 Landing Page (perpsclaw.com)
Build a public landing page SEPARATE from the arena. This is what people see first.

**Sections:**
1. **Hero** - Full-viewport animated background. "AI Agents Competing in Perpetual Futures. Live on Solana." Big CTA: "Watch the Arena" / "View Performance"
2. **Live Stats Banner** - Total trades executed, cumulative PnL, uptime hours, assets under management. Pull from on-chain data.
3. **The Agents** - 3 cards with personality. Shark: aggressive predator icon, momentum stats. Wolf: calculated pack icon, mean reversion stats. Grid: systematic matrix icon, grid stats. Show each agent's live PnL, win rate, Sharpe ratio.
4. **How It Works** - 3-step visual: (1) Agents analyze market via Pyth oracle, (2) Execute trades on Drift Protocol, (3) Compete for best risk-adjusted returns
5. **Performance Dashboard Preview** - Embedded iframe or screenshot of the arena with "Enter Arena" CTA
6. **Copy Trading** (Coming Soon) - "Follow the best-performing agent. Deposit SOL, earn proportional returns." Email capture for waitlist.
7. **Architecture** - Clean diagram: Pyth -> Agents -> Drift -> Solana. Shows the tech is real.
8. **Footer** - Twitter, GitHub, Docs links

**Design Requirements:**
- Dark theme matching arena (#06080c base)
- Smooth scroll animations (Framer Motion)
- Grain texture overlay (matches arena)
- Custom cursor on desktop
- Mobile-responsive
- Page load < 2s (static generation)
- Lottie or Three.js animated hero (trading chart morphing, agent avatars)

**Tech:**
- Same Next.js app, add landing page at `/` route
- Move arena to `/arena`
- Use `next/font` for Syne + JetBrains Mono (already configured)
- Add Framer Motion for scroll animations
- Add `react-countup` for animated stats

### 2.2 Domain & Hosting
- **Domain**: Buy `perpsclaw.com` (or `.io`, `.xyz`) on Namecheap/Cloudflare (~$10-15)
- **Hosting**: Deploy to Vercel (free tier works for frontend)
  ```bash
  cd web && vercel --prod
  ```
- **Agents**: Deploy to a VPS (Railway, Render, or DigitalOcean $12/mo droplet)
  - Use Docker Compose: `docker compose up -d`
  - Or Railway: 3 separate services from the monorepo

### 2.3 Analytics & SEO
- Add Vercel Analytics (free)
- Add OpenGraph meta tags + social preview image
- Title: "PerpsClaw - AI Agent Perpetual Futures Arena"
- Generate OG image: dark background, 3 agent icons, live PnL numbers

---

## Phase 3: Twitter Launch Strategy (Days 5-10)

### 3.1 Pre-Launch Content (Days 5-7)
Post a thread building anticipation. Each tweet stands alone.

**Tweet 1 - The Hook:**
> Building an AI trading arena where 3 autonomous agents compete trading SOL perpetual futures on @DriftProtocol
>
> Each agent has a different strategy. Real money. Real trades. Fully on-chain.
>
> Here's what I built [thread]

**Tweet 2 - The Agents:**
> Meet the agents:
>
> Shark - Momentum trader. Rides trends with SMA crossovers. 5x leverage.
> Wolf - Mean reversion. Buys fear, sells greed. Bollinger + RSI. 3x leverage.
> Grid - Market maker. 10 levels, catches every move. 2x leverage.
>
> Who wins?

**Tweet 3 - The Tech:**
> Tech stack:
> - @solaboratory price feeds (Pyth)
> - @DriftProtocol perpetual futures
> - Helius RPC
> - TypeScript agents running 24/7
> - Next.js arena viewer with live updates
>
> All open source. [GitHub link]

**Tweet 4 - The Demo Video:**
Record a 30-60 second screen recording of the arena:
- Show price chart moving
- Show agent making a trade
- Show PnL updating
- Show leaderboard shifting

Use Screen Studio or OBS. Add subtle zoom transitions.

**Tweet 5 - The Ask:**
> Going live with real SOL this week.
>
> Follow along: perpsclaw.com
>
> Phase 2: copy-trading. Deposit SOL, mirror the best agent's trades.
>
> Who would use this?

### 3.2 Launch Day (Day 8)
- Pin the thread
- Post the arena link
- Tag @DriftProtocol, @heaboratory, @solana
- Share in Drift Discord, Solana Discord, CT group chats
- Post on /r/solana, /r/algotrading

### 3.3 Ongoing Content (Days 8+)
- Daily PnL screenshots: "Day 3: Shark is up 12%, Wolf recovering from a bad RSI read"
- Weekly performance reports with charts
- "Agent of the week" posts
- Engage with replies, quote tweets

---

## Phase 4: Real Money Deployment (Days 7-14)

### 4.1 Pre-Flight Checklist
Before putting real money in:

- [ ] Run agents on devnet for minimum 48 hours without crashes
- [ ] Verify stop-loss triggers correctly (force a scenario)
- [ ] Verify circuit breaker triggers at -15% daily loss
- [ ] Verify trade cooldown prevents overtrading
- [ ] Confirm all 23 tests still pass
- [ ] Review risk.ts parameters one more time
- [ ] Set up monitoring/alerts (Telegram bot or Discord webhook for trades)

### 4.2 Switch to Mainnet

**Step 1: Update .env**
```
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=81ecc4f5-fda6-4158-9a3f-b898e300d2e6
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=81ecc4f5-fda6-4158-9a3f-b898e300d2e6
NETWORK=mainnet-beta
NEXT_PUBLIC_NETWORK=mainnet-beta
```

**Step 2: Generate NEW mainnet wallets**
Do NOT reuse devnet wallets. Generate fresh keypairs:
```bash
solana-keygen new --outfile keypairs/shark-mainnet.json --no-bip39-passphrase
solana-keygen new --outfile keypairs/wolf-mainnet.json --no-bip39-passphrase
solana-keygen new --outfile keypairs/grid-mainnet.json --no-bip39-passphrase
```
Update .env with new private keys.

**Step 3: Fund wallets**
Transfer real SOL to each agent wallet from your main wallet.

**Step 4: Deposit USDC collateral on Drift**
Each agent needs USDC deposited into their Drift account as margin collateral.

### 4.3 Recommended Starting Capital

Start small and scale up based on performance:

| Agent | SOL for fees | USDC Collateral | Max Position | Risk |
|-------|-------------|-----------------|--------------|------|
| Shark | 0.1 SOL | $50 USDC | ~$250 (5x) | Highest |
| Wolf  | 0.1 SOL | $50 USDC | ~$150 (3x) | Medium |
| Grid  | 0.1 SOL | $50 USDC | ~$100 (2x) | Lowest |

**Total starting capital: ~$150 USDC + 0.3 SOL (~$25)**
**Total at risk: ~$175**

This is enough to prove viability. Scale to $500-1000 per agent after 2 weeks of positive results.

### 4.4 Monitoring & Alerts

Build a simple Telegram/Discord notification bot:
```
Agent: Shark
Action: LONG 0.5 SOL-PERP @ $87.23
Reason: SMA(10) crossed above SMA(30)
PnL: +$3.42 (daily: +$12.80)
```

Add to the agent loop: POST to a webhook on every trade execution.

### 4.5 Risk Management Rules (Non-Negotiable)

1. **Never deploy more than you can lose entirely** - treat this as R&D budget
2. **Start on devnet, run 48+ hours, then mainnet** - no shortcuts
3. **Daily loss circuit breaker stays at -15%** - agents auto-halt
4. **Stop-loss on every position** - already implemented
5. **Monitor daily for first 2 weeks** - check logs morning and evening
6. **Kill switch**: `docker compose down` or kill the process immediately
7. **Upgrade Helius to paid plan** ($49/mo) before mainnet - free tier rate limits will cause missed trades

---

## Phase 5: Copy Trading & Revenue (Days 14-30)

### 5.1 Copy-Trade Architecture
Allow users to deposit SOL and automatically mirror an agent's trades proportionally.

**How it works:**
1. User deposits X USDC into a vault (Solana program or custodial)
2. When Shark opens a 1 SOL long, user's vault opens proportional position
3. User can withdraw anytime (closes their proportional position)

**Implementation options:**
- **Drift Delegate Trading**: Drift supports delegate authority — an agent can trade on behalf of sub-accounts. Most capital-efficient.
- **Custom Vault Program**: Anchor program that holds deposits and mirrors trades. More complex but fully decentralized.
- **Custodial MVP**: Simple server that manages sub-accounts. Fastest to build but requires trust.

**Recommendation**: Start with Drift delegate trading (simplest, built-in).

### 5.2 Revenue Model
- **Performance fee**: 20% of profits (industry standard for managed funds)
- **Management fee**: 1% annual on AUM (optional, adds recurring revenue)
- **$CLAW token**: Governance + fee sharing (Phase 3, only if there's real traction)

---

## Phase 6: Scale & Polish (Days 30-60)

### 6.1 Additional Markets
- Add BTC-PERP, ETH-PERP agents
- Multi-market agents that trade correlations

### 6.2 Strategy Improvements
- Replace fixed SMA/RSI with ML-trained signals
- Add funding rate arbitrage strategy
- Add cross-exchange basis trading

### 6.3 Infrastructure
- Upgrade Helius to dedicated node ($299/mo) for zero rate limits
- Add redundant RPC failover
- Move agents to bare metal for lowest latency
- Add Grafana dashboard for agent metrics

### 6.4 Legal
- Consult a crypto-native lawyer about fund structure
- Consider registering as an investment advisor (if managing others' funds)
- Terms of service for copy-trading users

---

## Budget Summary

| Item | Cost | When |
|------|------|------|
| Domain (perpsclaw.com) | $12/yr | Day 3 |
| Vercel hosting (frontend) | Free | Day 3 |
| VPS for agents (DigitalOcean) | $12/mo | Day 3 |
| Helius RPC (paid plan) | $49/mo | Day 7 (before mainnet) |
| Agent trading capital | $175 start | Day 7 |
| Screen Studio (demo video) | $89 one-time | Day 5 |
| **Total to launch** | **~$340** | |

---

## Immediate Next Steps (Today)

1. Fund devnet wallets via https://faucet.solana.com (3 airdrops)
2. Deposit devnet USDC into Drift for each agent
3. Start all 3 agents, watch them trade for 1 hour
4. Record a demo video of the arena with agents trading
5. Buy domain
6. Deploy frontend to Vercel
7. Write launch thread

---

## Success Metrics

**Week 1 (Devnet)**
- [ ] All 3 agents running 24+ hours without crash
- [ ] At least 50 trades executed across agents
- [ ] Frontend live at perpsclaw.com
- [ ] Launch thread posted

**Week 2 (Mainnet)**
- [ ] Agents trading real money on mainnet
- [ ] Daily PnL posts on Twitter
- [ ] 100+ followers on launch thread
- [ ] Zero unplanned downtime

**Month 1**
- [ ] Cumulative positive PnL across agents
- [ ] Copy-trading MVP live
- [ ] First external user deposits
- [ ] 500+ Twitter followers
