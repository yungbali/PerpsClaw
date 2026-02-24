import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface ReasoningEntry {
  timestamp: number;
  agentName: string;
  price: number;
  regime: string;
  hurst: number;
  atr: number;
  atrPercent: number;
  positionSize: number;
  entryPrice: number;
  unrealizedPnl: number;
  signal: string;
  confidence: number;
  reason: string;
  riskChecks: string[];
}

interface AgentHistoricalStats {
  totalTrades: number;
  cumulativePnl: number;
  winRate: number;
  totalSignals: number;
  lastActive: number;
  bestPnl: number;
  worstPnl: number;
}

const REASONING_FILE = "reasoning.jsonl";

function computeStats(entries: ReasoningEntry[]): Record<string, AgentHistoricalStats> {
  const agentData: Record<string, ReasoningEntry[]> = {};

  for (const entry of entries) {
    const name = entry.agentName.toLowerCase();
    if (!agentData[name]) agentData[name] = [];
    agentData[name].push(entry);
  }

  const result: Record<string, AgentHistoricalStats> = {};

  for (const [agentName, agentEntries] of Object.entries(agentData)) {
    const sorted = agentEntries.sort((a, b) => a.timestamp - b.timestamp);

    let totalTrades = 0;
    let wins = 0;
    let bestPnl = 0;
    let worstPnl = 0;
    let lastPnlAtOpen = 0;
    let wasInPosition = false;

    for (const entry of sorted) {
      const inPosition = entry.positionSize !== 0;
      const isTradeSignal = entry.signal === "long" || entry.signal === "short" || entry.signal === "close";

      if (isTradeSignal) {
        totalTrades++;
      }

      // Track position transitions to compute wins/losses
      if (wasInPosition && !inPosition) {
        const tradePnl = entry.unrealizedPnl - lastPnlAtOpen;
        if (tradePnl > 0) wins++;
        bestPnl = Math.max(bestPnl, entry.unrealizedPnl);
        worstPnl = Math.min(worstPnl, entry.unrealizedPnl);
      }

      if (!wasInPosition && inPosition) {
        lastPnlAtOpen = entry.unrealizedPnl;
      }

      wasInPosition = inPosition;
    }

    const lastEntry = sorted[sorted.length - 1];
    const latestPnl = lastEntry?.unrealizedPnl ?? 0;

    bestPnl = Math.max(bestPnl, latestPnl);
    worstPnl = Math.min(worstPnl, latestPnl);

    result[agentName] = {
      totalTrades: Math.max(totalTrades, 1),
      cumulativePnl: latestPnl,
      winRate: totalTrades > 0 ? wins / Math.max(totalTrades, 1) : 0,
      totalSignals: sorted.length,
      lastActive: lastEntry?.timestamp ?? 0,
      bestPnl,
      worstPnl,
    };
  }

  return result;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reasoningDir = process.env.REASONING_DIR || "/tmp/perpsclaw";
    const filePath = join(reasoningDir, REASONING_FILE);

    if (!existsSync(filePath)) {
      return NextResponse.json({ agents: {}, totalEntries: 0 });
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    const entries: ReasoningEntry[] = lines
      .map((line) => {
        try {
          return JSON.parse(line) as ReasoningEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is ReasoningEntry => e !== null);

    const stats = computeStats(entries);

    return NextResponse.json({
      agents: stats,
      totalEntries: entries.length,
      firstEntry: entries[0]?.timestamp ?? 0,
      lastEntry: entries[entries.length - 1]?.timestamp ?? 0,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ agents: {}, totalEntries: 0, error: "Failed to compute stats" });
  }
}
