#!/bin/bash
# Setup script for the OpenClaw → Dashboard bridge on VPS.
# Run from the repo root: bash deploy/bridge/setup.sh

set -euo pipefail

BRIDGE_DIR="/root/perpsclaw-agents/shared-skill/scripts"
SYSTEMD_DIR="/etc/systemd/system"

echo "==> Creating bridge script directory..."
mkdir -p "$BRIDGE_DIR"

echo "==> Copying bridge.ts..."
cp deploy/bridge/bridge.ts "$BRIDGE_DIR/bridge.ts"

echo "==> Creating reasoning output directory..."
mkdir -p /tmp/perpsclaw

echo "==> Installing systemd units..."
cp deploy/bridge/perpsclaw-bridge.service "$SYSTEMD_DIR/"
cp deploy/bridge/perpsclaw-bridge.timer "$SYSTEMD_DIR/"

# Update the service ExecStart to point to the correct location
sed -i "s|/root/perpsclaw-agents/shared-skill/scripts/bridge.ts|${BRIDGE_DIR}/bridge.ts|" \
  "$SYSTEMD_DIR/perpsclaw-bridge.service"

echo "==> Enabling and starting timer..."
systemctl daemon-reload
systemctl enable perpsclaw-bridge.timer
systemctl start perpsclaw-bridge.timer

echo "==> Running bridge once to verify..."
npx tsx "$BRIDGE_DIR/bridge.ts"

echo ""
echo "==> Done! Check status with:"
echo "    systemctl status perpsclaw-bridge.timer"
echo "    systemctl list-timers perpsclaw-bridge.timer"
echo "    journalctl -u perpsclaw-bridge.service -f"
echo "    cat /tmp/perpsclaw/reasoning.jsonl | tail -5"
