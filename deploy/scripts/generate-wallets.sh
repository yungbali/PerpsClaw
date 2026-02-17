#!/bin/bash
set -e

KEYPAIR_DIR="$(dirname "$0")/../../keypairs"
mkdir -p "$KEYPAIR_DIR"

for AGENT in shark wolf grid; do
  FILE="$KEYPAIR_DIR/$AGENT.json"
  if [ -f "$FILE" ]; then
    echo "Keypair already exists: $FILE"
  else
    solana-keygen new --no-bip39-passphrase --outfile "$FILE" --silent
    echo "Generated: $FILE"
  fi
  PUBKEY=$(solana-keygen pubkey "$FILE")
  echo "  $AGENT wallet: $PUBKEY"
done

echo ""
echo "Add these to .env:"
for AGENT in shark wolf grid; do
  FILE="$KEYPAIR_DIR/$AGENT.json"
  PUBKEY=$(solana-keygen pubkey "$FILE")
  UPPER=$(echo "$AGENT" | tr '[:lower:]' '[:upper:]')
  echo "NEXT_PUBLIC_${UPPER}_WALLET=$PUBKEY"
done

echo ""
echo "Extract private keys with:"
echo '  cat keypairs/shark.json | python3 -c "import json,sys,base64; d=json.load(sys.stdin); import base58; print(base58.b58encode(bytes(d)).decode())"'
