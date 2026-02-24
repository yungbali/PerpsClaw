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

const REASONING_FILE = "reasoning.jsonl";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get("agent");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const reasoningDir = process.env.REASONING_DIR || "/tmp/perpsclaw";
    const filePath = join(reasoningDir, REASONING_FILE);

    if (!existsSync(filePath)) {
      return NextResponse.json({ entries: [] });
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    let entries: ReasoningEntry[] = lines
      .map((line) => {
        try {
          return JSON.parse(line) as ReasoningEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is ReasoningEntry => e !== null);

    if (agent) {
      entries = entries.filter(
        (e) => e.agentName.toLowerCase() === agent.toLowerCase()
      );
    }

    // Most recent first
    entries = entries.slice(-limit).reverse();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Reasoning API error:", error);
    return NextResponse.json({ entries: [], error: "Failed to read reasoning log" });
  }
}
