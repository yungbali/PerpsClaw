#!/bin/bash
# PerpsClaw Mainnet Switchover Script
# Usage: bash switch-to-mainnet.sh <RPC_URL> <SHARK_KEY> <WOLF_KEY> <GRID_KEY>
#
# This script:
# 1. Updates all .env files to mainnet
# 2. Deploys mainnet SOUL.md files (conservative risk rules)
# 3. Updates cron messages for mainnet
# 4. Archives old devnet sessions
# 5. Restarts OpenClaw

set -e

RPC_URL="$1"
SHARK_KEY="$2"
WOLF_KEY="$3"
GRID_KEY="$4"

if [ -z "$RPC_URL" ] || [ -z "$SHARK_KEY" ] || [ -z "$WOLF_KEY" ] || [ -z "$GRID_KEY" ]; then
  echo "Usage: bash switch-to-mainnet.sh <RPC_URL> <SHARK_PRIVATE_KEY> <WOLF_PRIVATE_KEY> <GRID_PRIVATE_KEY>"
  echo ""
  echo "  RPC_URL: Solana mainnet RPC (e.g. https://mainnet.helius-rpc.com/?api-key=xxx)"
  echo "  SHARK_KEY: Base58 private key for Shark agent wallet"
  echo "  WOLF_KEY: Base58 private key for Wolf agent wallet"
  echo "  GRID_KEY: Base58 private key for Grid agent wallet"
  exit 1
fi

echo "============================================"
echo "  PERPSCLAW MAINNET SWITCHOVER"
echo "============================================"
echo ""
echo "  RPC: ${RPC_URL:0:40}..."
echo "  Shark key: ${SHARK_KEY:0:8}..."
echo "  Wolf key:  ${WOLF_KEY:0:8}..."
echo "  Grid key:  ${GRID_KEY:0:8}..."
echo ""

# --- 1. Update agent .env files ---
echo "[1/6] Updating agent .env files..."

cat > /root/perpsclaw-agents/openclaw-shark/.env << EOF
SOLANA_RPC_URL=$RPC_URL
NETWORK=mainnet-beta
AGENT_PRIVATE_KEY=$SHARK_KEY
SHARK_PRIVATE_KEY=$SHARK_KEY
EOF

cat > /root/perpsclaw-agents/openclaw-wolf/.env << EOF
SOLANA_RPC_URL=$RPC_URL
NETWORK=mainnet-beta
AGENT_PRIVATE_KEY=$WOLF_KEY
WOLF_PRIVATE_KEY=$WOLF_KEY
EOF

cat > /root/perpsclaw-agents/openclaw-grid/.env << EOF
SOLANA_RPC_URL=$RPC_URL
NETWORK=mainnet-beta
AGENT_PRIVATE_KEY=$GRID_KEY
GRID_PRIVATE_KEY=$GRID_KEY
EOF

echo "  Agent .env files updated"

# --- 2. Update main .env ---
echo "[2/6] Updating main .env..."

# Derive public keys from private keys using node
SHARK_PUBKEY=$(node -e "
const bs58 = require('/root/perpsclaw-agents/shared-skill/node_modules/bs58');
const { Keypair } = require('/root/perpsclaw-agents/shared-skill/node_modules/@solana/web3.js');
const kp = Keypair.fromSecretKey(bs58.default.decode('$SHARK_KEY'));
console.log(kp.publicKey.toBase58());
" 2>/dev/null) || SHARK_PUBKEY="UPDATE_ME"

WOLF_PUBKEY=$(node -e "
const bs58 = require('/root/perpsclaw-agents/shared-skill/node_modules/bs58');
const { Keypair } = require('/root/perpsclaw-agents/shared-skill/node_modules/@solana/web3.js');
const kp = Keypair.fromSecretKey(bs58.default.decode('$WOLF_KEY'));
console.log(kp.publicKey.toBase58());
" 2>/dev/null) || WOLF_PUBKEY="UPDATE_ME"

GRID_PUBKEY=$(node -e "
const bs58 = require('/root/perpsclaw-agents/shared-skill/node_modules/bs58');
const { Keypair } = require('/root/perpsclaw-agents/shared-skill/node_modules/@solana/web3.js');
const kp = Keypair.fromSecretKey(bs58.default.decode('$GRID_KEY'));
console.log(kp.publicKey.toBase58());
" 2>/dev/null) || GRID_PUBKEY="UPDATE_ME"

cat > /root/PerpsClaw/.env << EOF
# Solana RPC (Mainnet)
SOLANA_RPC_URL=$RPC_URL
NEXT_PUBLIC_SOLANA_RPC_URL=$RPC_URL

# Pyth Hermes
PYTH_HERMES_URL=https://hermes.pyth.network
NEXT_PUBLIC_PYTH_HERMES_URL=https://hermes.pyth.network

# Agent private keys (base58 encoded)
SHARK_PRIVATE_KEY=$SHARK_KEY
WOLF_PRIVATE_KEY=$WOLF_KEY
GRID_PRIVATE_KEY=$GRID_KEY

# Agent wallet addresses (pubkeys, for frontend)
NEXT_PUBLIC_SHARK_WALLET=$SHARK_PUBKEY
NEXT_PUBLIC_WOLF_WALLET=$WOLF_PUBKEY
NEXT_PUBLIC_GRID_WALLET=$GRID_PUBKEY

# Network
NETWORK=mainnet-beta
NEXT_PUBLIC_NETWORK=mainnet-beta
EOF

echo "  Main .env updated (wallets: $SHARK_PUBKEY, $WOLF_PUBKEY, $GRID_PUBKEY)"

# --- 3. Deploy mainnet SOUL.md files ---
echo "[3/6] Deploying mainnet SOUL.md files..."

cp /tmp/soul-shark-mainnet.md /root/perpsclaw-workspaces/shark/SOUL.md
cp /tmp/soul-shark-mainnet.md /root/perpsclaw-agents/openclaw-shark/SOUL.md

cp /tmp/soul-wolf-mainnet.md /root/perpsclaw-workspaces/wolf/SOUL.md
cp /tmp/soul-wolf-mainnet.md /root/perpsclaw-agents/openclaw-wolf/SOUL.md

cp /tmp/soul-grid-mainnet.md /root/perpsclaw-workspaces/grid/SOUL.md
cp /tmp/soul-grid-mainnet.md /root/perpsclaw-agents/openclaw-grid/SOUL.md

echo "  SOUL.md files deployed"

# --- 4. Update cron messages for mainnet ---
echo "[4/6] Updating cron messages..."

python3 << 'PYEOF'
import json

configs = {
    "shark": {
        "cron": "/root/perpsclaw-agents/openclaw-shark/cron/jobs.json",
        "message": """MAINNET TRADING LOOP — Real money. Be disciplined.

STEP 1: Run price.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/price.ts --market sol

STEP 2: Run market.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/market.ts --market sol

STEP 3: Run position.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/position.ts --key SHARK_PRIVATE_KEY --market sol

STEP 4: Analyze signals. Only trade if ALL conditions in your strategy are met.
- If clear bullish signal AND flat: trade.ts --action long --size 0.1
- If clear bearish signal AND flat: trade.ts --action short --size 0.1
- If PnL < -3%: trade.ts --action close (MANDATORY stop-loss)
- If PnL > +6%: trade.ts --action close (take profit)
- If signals unclear: DO NOTHING. Report and wait.

Trade: /root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/trade.ts --key SHARK_PRIVATE_KEY --market sol --action ACTION --size SIZE

STEP 5: Report decision in 1-2 sentences. This is REAL MONEY — only trade on clear signals."""
    },
    "wolf": {
        "cron": "/root/perpsclaw-agents/openclaw-wolf/cron/jobs.json",
        "message": """MAINNET TRADING LOOP — Real money. Be patient.

STEP 1: Run price.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/price.ts --market eth

STEP 2: Run market.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/market.ts --market eth

STEP 3: Run position.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/position.ts --key WOLF_PRIVATE_KEY --market eth

STEP 4: Check for extremes. Only trade at TRUE Bollinger Band extremes with RSI confirmation.
- If price <= bbLower AND rsi14 < 30 AND flat: trade.ts --action long --size 0.02
- If price >= bbUpper AND rsi14 > 70 AND flat: trade.ts --action short --size 0.02
- If in position and price near bbMiddle: trade.ts --action close
- If PnL < -2%: trade.ts --action close (MANDATORY stop-loss)
- If PnL > +4%: trade.ts --action close (take profit)
- If no extreme: DO NOTHING. Patience is the strategy.

Trade: /root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/trade.ts --key WOLF_PRIVATE_KEY --market eth --action ACTION --size SIZE

STEP 5: Report price vs bands, RSI, and decision. Most loops should be 'no extreme, waiting.'"""
    },
    "grid": {
        "cron": "/root/perpsclaw-agents/openclaw-grid/cron/jobs.json",
        "message": """MAINNET TRADING LOOP — Real money. Trade only at grid levels.

STEP 1: Run price.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/price.ts --market btc

STEP 2: Run position.ts
/root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/position.ts --key GRID_PRIVATE_KEY --market btc

STEP 3: Calculate actual P&L from entry price vs current price (NOT from unrealizedPnl field).
- Long: (currentPrice - entryPrice) / entryPrice * 100
- Short: (entryPrice - currentPrice) / entryPrice * 100

STEP 4: Decide based on grid levels:
- If flat: trade.ts --action long --size 0.0001
- If P&L > +0.4%: close and flip direction (--size 0.0001)
- If P&L < -0.8%: close and re-enter long (--size 0.0001)
- Otherwise: HOLD. Most loops = no trade. Report and wait.

Trade: /root/perpsclaw-agents/shared-skill/node_modules/.bin/tsx --env-file=/root/PerpsClaw/.env /root/perpsclaw-agents/shared-skill/scripts/trade.ts --key GRID_PRIVATE_KEY --market btc --action ACTION --size 0.0001

STEP 5: Report entry, current price, P&L %, decision. Only trade at grid levels."""
    }
}

for name, cfg in configs.items():
    with open(cfg["cron"]) as f:
        d = json.load(f)
    for job in d["jobs"]:
        if "trading-loop" in job.get("name", ""):
            job["payload"]["message"] = cfg["message"]
    with open(cfg["cron"], "w") as f:
        json.dump(d, f, indent=2)
    print(f"  {name} cron updated")
PYEOF

# --- 5. Archive devnet sessions and reasoning ---
echo "[5/6] Archiving devnet data..."

mkdir -p /root/perpsclaw-agents/devnet-archive
cp /tmp/perpsclaw/reasoning.jsonl /root/perpsclaw-agents/devnet-archive/reasoning-devnet.jsonl 2>/dev/null || true
rm -f /tmp/perpsclaw/reasoning.jsonl
rm -f /root/perpsclaw-agents/bridge-state.json

for agent in openclaw-shark openclaw-wolf openclaw-grid; do
  SESSDIR="/root/perpsclaw-agents/$agent/agents/main/sessions"
  for f in "$SESSDIR"/*.jsonl; do
    [ -f "$f" ] && mv "$f" "${f}.devnet-bak"
  done
done

echo "  Devnet data archived"

# --- 6. Rebuild web container and restart ---
echo "[6/6] Rebuilding web container for mainnet..."

cd /root/PerpsClaw/deploy
docker compose build web --no-cache 2>&1 | tail -3
docker compose up -d web 2>&1 | tail -3

echo ""
echo "  Restarting OpenClaw..."
docker restart openclaw-xjsw-openclaw-1 2>&1

echo ""
echo "============================================"
echo "  MAINNET SWITCHOVER COMPLETE"
echo "============================================"
echo ""
echo "  Network:  mainnet-beta"
echo "  Shark:    $SHARK_PUBKEY (SOL-PERP, 0.1 SOL trades)"
echo "  Wolf:     $WOLF_PUBKEY (ETH-PERP, 0.02 ETH trades)"
echo "  Grid:     $GRID_PUBKEY (BTC-PERP, 0.0001 BTC trades)"
echo ""
echo "  NEXT STEPS:"
echo "  1. Fund each wallet with SOL (for tx fees) + USDC (for collateral)"
echo "  2. Each wallet needs a Drift account — deposit USDC into Drift"
echo "  3. Agents will start trading on next cron loop (~2 min)"
echo "  4. Monitor at http://187.77.103.205:8080/arena/shark"
echo ""
echo "  To revert to devnet: restore .env files from devnet-archive"
echo "============================================"
