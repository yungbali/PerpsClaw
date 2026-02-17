#!/bin/bash
set -e

# Fund each agent with SOL for collateral + tx fees
# Usage: ./fund-agents.sh <amount_sol> [--devnet]
# Example: ./fund-agents.sh 1.1

AMOUNT=${1:-1.1}
NETWORK=""

if [ "$2" = "--devnet" ]; then
  NETWORK="--url devnet"
fi

KEYPAIR_DIR="$(dirname "$0")/../../keypairs"

for AGENT in shark wolf grid; do
  FILE="$KEYPAIR_DIR/$AGENT.json"
  if [ ! -f "$FILE" ]; then
    echo "Error: $FILE not found. Run generate-wallets.sh first."
    exit 1
  fi

  PUBKEY=$(solana-keygen pubkey "$FILE")

  if [ "$2" = "--devnet" ]; then
    echo "Airdropping $AMOUNT SOL to $AGENT ($PUBKEY) on devnet..."
    solana airdrop "$AMOUNT" "$PUBKEY" --url devnet || echo "Airdrop failed (rate limited?)"
  else
    echo "Transferring $AMOUNT SOL to $AGENT ($PUBKEY)..."
    solana transfer "$PUBKEY" "$AMOUNT" $NETWORK --allow-unfunded-recipient
  fi
done

echo "Done. Check balances:"
for AGENT in shark wolf grid; do
  FILE="$KEYPAIR_DIR/$AGENT.json"
  PUBKEY=$(solana-keygen pubkey "$FILE")
  echo -n "  $AGENT: "
  solana balance "$PUBKEY" $NETWORK
done
