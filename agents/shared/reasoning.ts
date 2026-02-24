import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { logger } from "./logger.js";

/**
 * Agent reasoning log entry.
 * Captures the decision-making process of each agent for UI display.
 */
export interface ReasoningEntry {
  timestamp: number;
  agentName: string;
  price: number;

  // Market analysis
  regime: string;
  hurst: number;
  atr: number;
  atrPercent: number;

  // Position state
  positionSize: number;
  entryPrice: number;
  unrealizedPnl: number;

  // Decision
  signal: "long" | "short" | "close" | "none";
  confidence: number;
  reason: string;

  // Risk checks applied
  riskChecks: string[];
}

const REASONING_DIR = process.env.REASONING_DIR || "/tmp/perpsclaw";
const REASONING_FILE = "reasoning.jsonl";
const MAX_ENTRIES = 100; // Keep last 100 entries per agent

function ensureDir(): void {
  if (!existsSync(REASONING_DIR)) {
    mkdirSync(REASONING_DIR, { recursive: true });
  }
}

/**
 * Write a reasoning entry to the log.
 * Called after each strategy evaluation to capture decision context.
 */
export function logReasoning(entry: ReasoningEntry): void {
  try {
    ensureDir();
    const filePath = join(REASONING_DIR, REASONING_FILE);
    const line = JSON.stringify(entry) + "\n";
    appendFileSync(filePath, line);

    // Periodically trim the file to prevent unbounded growth
    trimReasoningLog();
  } catch (err) {
    logger.debug(`Failed to log reasoning: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Trim the reasoning log to keep only recent entries.
 */
function trimReasoningLog(): void {
  try {
    const filePath = join(REASONING_DIR, REASONING_FILE);
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    // Keep last MAX_ENTRIES * 3 (for 3 agents)
    const maxLines = MAX_ENTRIES * 3;
    if (lines.length > maxLines * 1.5) {
      const trimmed = lines.slice(-maxLines);
      writeFileSync(filePath, trimmed.join("\n") + "\n");
    }
  } catch {
    // Ignore trim errors
  }
}

/**
 * Read recent reasoning entries (for API endpoint).
 */
export function getRecentReasoning(agentName?: string, limit: number = 50): ReasoningEntry[] {
  try {
    const filePath = join(REASONING_DIR, REASONING_FILE);
    if (!existsSync(filePath)) return [];

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

    if (agentName) {
      entries = entries.filter((e) => e.agentName.toLowerCase() === agentName.toLowerCase());
    }

    return entries.slice(-limit).reverse(); // Most recent first
  } catch {
    return [];
  }
}
