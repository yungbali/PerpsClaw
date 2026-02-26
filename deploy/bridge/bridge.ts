#!/usr/bin/env npx tsx
/**
 * OpenClaw -> ReasoningEntry bridge script (v2 - full reasoning chain).
 *
 * Reads the latest OpenClaw session JSONL for each agent (shark, wolf, grid),
 * extracts tool results + full assistant reasoning in "rounds", and appends
 * ReasoningEntry objects to /tmp/perpsclaw/reasoning.jsonl so the web dashboard
 * can display live agent activity with complete markdown analysis.
 *
 * A "round" is one cycle of: tool results (price/market/position) followed by
 * an assistant message with substantial analysis text (>200 chars).
 *
 * Run via systemd timer every 60s, or manually:
 *   npx tsx bridge.ts
 */

import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "fs";
import { join } from "path";

// -- Config -------------------------------------------------------------------

const AGENTS = [
  { name: "Shark", dir: "openclaw-shark" },
  { name: "Wolf", dir: "openclaw-wolf" },
  { name: "Grid", dir: "openclaw-grid" },
] as const;

const AGENTS_ROOT = process.env.AGENTS_ROOT || "/root/perpsclaw-agents";
const REASONING_DIR = process.env.REASONING_DIR || "/tmp/perpsclaw";
const REASONING_FILE = join(REASONING_DIR, "reasoning.jsonl");
const STATE_FILE = join(AGENTS_ROOT, "bridge-state.json");
const MAX_REASONING_LINES = 300; // trim threshold (100 per agent)

// -- Types --------------------------------------------------------------------

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
  signal: "long" | "short" | "close" | "none";
  confidence: number;
  reason: string;
  riskChecks: string[];
  fullReasoning: string;
  rsi?: number;
  sma10?: number;
  sma30?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  trend?: string;
  volatility?: string;
  collateral?: number;
  model?: string;
}

interface AgentState {
  lastSessionFile: string;
  lastLineCount: number;
}

type BridgeState = Record<string, AgentState>;

// -- OpenClaw JSONL types -----------------------------------------------------

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  arguments?: any;
  thinking?: string;
}

interface OpenClawEntry {
  type: string;
  timestamp?: string;
  message?: {
    role: string;
    content?: ContentBlock[];
    toolCallId?: string;
    toolName?: string;
    isError?: boolean;
    details?: any;
    timestamp?: number;
    model?: string;
    stopReason?: string;
  };
}

// -- Helpers ------------------------------------------------------------------

function loadState(): BridgeState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveState(state: BridgeState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Find the latest session file. If the latest is all errors (e.g. 402 credit
 * exhaustion where every assistant message has stopReason "error" with empty
 * content), fall back to the second-latest session.
 */
function findLatestSession(agentDir: string): string | null {
  const sessionsDir = join(agentDir, "agents", "main", "sessions");
  if (!existsSync(sessionsDir)) return null;

  const files = readdirSync(sessionsDir)
    .filter((f) => f.endsWith(".jsonl") && !f.endsWith(".lock"))
    .map((f) => ({
      name: f,
      path: join(sessionsDir, f),
      mtime: statSync(join(sessionsDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) return null;

  // Check if the latest session is all errors
  for (const file of files.slice(0, 2)) {
    if (!isAllErrorSession(file.path)) {
      return file.path;
    }
    console.log(`[bridge] Skipping all-error session: ${file.name}`);
  }

  // If both top sessions are errors, still return the latest
  return files[0].path;
}

/**
 * Returns true if every assistant message in the session has stopReason "error"
 * and empty/missing content, indicating a credit-exhausted or broken session.
 */
function isAllErrorSession(filePath: string): boolean {
  const entries = parseJsonl(filePath);
  const assistantMessages = entries.filter(
    (e) => e.type === "message" && e.message?.role === "assistant"
  );

  if (assistantMessages.length === 0) return false;

  return assistantMessages.every((e) => {
    const msg = e.message!;
    if (msg.stopReason !== "error") return false;
    // Empty content or no text blocks with actual content
    if (!msg.content || msg.content.length === 0) return true;
    return !msg.content.some(
      (b) => b.type === "text" && b.text && b.text.trim().length > 0
    );
  });
}

function parseJsonl(filePath: string): OpenClawEntry[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const results: OpenClawEntry[] = [];
  for (const line of lines) {
    try {
      results.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return results;
}

/**
 * Extract all JSON objects from a text blob that may contain noise
 * (e.g. "bigint: Failed to load..." warnings before the JSON, or
 * "Process exited with code 0." after).
 */
function extractAllJson(text: string): any[] {
  const results: any[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("{")) continue;
    // Find JSON object in the line
    const match = trimmed.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (match) {
      try {
        results.push(JSON.parse(match[0]));
      } catch {
        // not valid JSON
      }
    }
  }
  return results;
}

function parseSignal(text: string): "long" | "short" | "close" | "none" {
  const lower = text.toLowerCase();
  if (/\b(open(ing|ed)?|enter(ing|ed)?|go(ing)?|plac(e|ing|ed))\s+(a\s+)?long\b/.test(lower)) return "long";
  if (/\b(open(ing|ed)?|enter(ing|ed)?|go(ing)?|plac(e|ing|ed))\s+(a\s+)?short\b/.test(lower)) return "short";
  if (/\b(clos(e|ing|ed)|exit(ing|ed)?)\s+(the\s+)?(position|trade)\b/.test(lower)) return "close";
  if (/\baction["']?\s*:\s*["']?long/i.test(text)) return "long";
  if (/\baction["']?\s*:\s*["']?short/i.test(text)) return "short";
  if (/\baction["']?\s*:\s*["']?close/i.test(text)) return "close";
  if (/\b(do nothing|hold|stay flat|no trade|no action|remain flat)\b/.test(lower)) return "none";
  return "none";
}

function extractReason(text: string, maxLen = 200): string {
  const cleaned = text.replace(/[#*_`]/g, "").trim();
  const firstPara = cleaned.split(/\n\n/)[0] || cleaned;
  if (firstPara.length <= maxLen) return firstPara;
  return firstPara.slice(0, maxLen - 3) + "...";
}

function mapTrendToRegime(trend: string | undefined): string {
  switch (trend) {
    case "bullish":
      return "trending-up";
    case "bearish":
      return "trending-down";
    default:
      return "random";
  }
}

// -- Round-based extraction ---------------------------------------------------

/** Accumulated market data from tool results within a round. */
interface RoundData {
  price: number;
  rsi?: number;
  sma10?: number;
  sma30?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  trend?: string;
  volatility?: string;
  positionSize: number;
  side: string;
  entryPrice: number;
  unrealizedPnl: number;
  collateral?: number;
  signal: "long" | "short" | "close" | "none";
  fullReasoning: string;
  reason: string;
  model?: string;
  timestamp: number;
  hasData: boolean;
}

function newRound(): RoundData {
  return {
    price: 0,
    positionSize: 0,
    side: "flat",
    entryPrice: 0,
    unrealizedPnl: 0,
    signal: "none",
    fullReasoning: "",
    reason: "",
    timestamp: Date.now(),
    hasData: false,
  };
}

/**
 * Apply parsed JSON data from a tool result to the current round.
 */
function applyToolJson(round: RoundData, json: any): void {
  if (json.error) return;

  // Price tool output: { market, price, timestamp } -- no sma10, no positionSize
  if (json.price !== undefined && json.market && json.sma10 === undefined && json.positionSize === undefined) {
    round.price = json.price;
    round.hasData = true;
  }

  // Market tool output: { price, sma10, sma30, rsi14, bbUpper, bbMiddle, bbLower, trend, volatility, samplesCollected }
  if (json.sma10 !== undefined || (json.trend !== undefined && json.samplesCollected !== undefined)) {
    if (json.price) round.price = json.price;
    if (json.sma10 !== undefined) round.sma10 = json.sma10;
    if (json.sma30 !== undefined) round.sma30 = json.sma30;
    if (json.rsi14 !== undefined) round.rsi = json.rsi14;
    if (json.bbUpper !== undefined) round.bbUpper = json.bbUpper;
    if (json.bbMiddle !== undefined) round.bbMiddle = json.bbMiddle;
    if (json.bbLower !== undefined) round.bbLower = json.bbLower;
    if (json.trend) round.trend = json.trend;
    if (json.volatility) round.volatility = json.volatility;
    round.hasData = true;
  }

  // Position tool output: { market, wallet, positionSize, side, entryPrice, unrealizedPnl, collateral, walletSolBalance }
  if (json.positionSize !== undefined && json.wallet !== undefined) {
    round.positionSize = json.positionSize;
    round.side = json.side || "flat";
    round.entryPrice = json.entryPrice || 0;
    round.unrealizedPnl = json.unrealizedPnl || 0;
    if (json.collateral !== undefined) round.collateral = json.collateral;
    round.hasData = true;
  }

  // Trade tool output: { success, action, size, txSig }
  if (json.success && json.action) {
    if (json.action === "long") round.signal = "long";
    else if (json.action === "short") round.signal = "short";
    else if (json.action === "close") round.signal = "close";
    round.hasData = true;
  }
}

/**
 * Ingest tool result text (from content blocks or details.aggregated)
 * into the current round.
 */
function ingestToolText(round: RoundData, text: string): void {
  const jsons = extractAllJson(text);
  for (const json of jsons) {
    applyToolJson(round, json);
  }
}

/**
 * Process entries in "rounds". Each round accumulates tool results until
 * an assistant message with substantial text (>200 chars) appears, at which
 * point we finalize the round and emit a ReasoningEntry.
 *
 * Returns an array of completed rounds (there may be multiple per session slice).
 */
function processEntriesInRounds(entries: OpenClawEntry[]): RoundData[] {
  const completedRounds: RoundData[] = [];
  let current = newRound();

  for (const entry of entries) {
    if (entry.type !== "message" || !entry.message) continue;
    const msg = entry.message;

    // -- Handle toolResult messages (from tools named "exec", "process", etc.) --
    if (msg.role === "toolResult" && !msg.isError && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "text" && block.text) {
          ingestToolText(current, block.text);
        }
      }
      // Also check details.aggregated
      if (msg.details?.aggregated) {
        ingestToolText(current, msg.details.aggregated);
      }
    }

    // -- Handle assistant messages --
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      // Skip pure error messages
      if (msg.stopReason === "error") continue;

      let assistantText = "";

      for (const block of msg.content) {
        // Collect reasoning text
        if (block.type === "text" && block.text) {
          assistantText += block.text + "\n";
        }

        // Check toolCall blocks for trade actions in command args
        if (block.type === "toolCall" && block.arguments?.command) {
          const cmd: string = block.arguments.command;
          if (cmd.includes("trade.ts")) {
            if (cmd.includes("--action long") || cmd.includes("--direction long")) current.signal = "long";
            else if (cmd.includes("--action short") || cmd.includes("--direction short")) current.signal = "short";
            else if (cmd.includes("--action close") || cmd.includes("--direction close")) current.signal = "close";
          }
        }
      }

      assistantText = assistantText.trim();

      // Extract model name from the message
      if (msg.model) {
        current.model = msg.model;
      }

      // A round completes when we get substantial assistant analysis text
      // after accumulating tool result data
      if (assistantText.length > 200 && current.hasData) {
        current.fullReasoning = assistantText;
        current.reason = extractReason(assistantText);

        // Parse signal from assistant text if not already set by trade result
        if (current.signal === "none") {
          current.signal = parseSignal(assistantText);
        }

        // Set timestamp from the message if available
        if (msg.timestamp) {
          current.timestamp = msg.timestamp;
        }

        completedRounds.push(current);

        // Start a new round, carrying forward the model name
        const prevModel = current.model;
        current = newRound();
        current.model = prevModel;
      } else if (assistantText.length > 0) {
        // Short assistant text -- not a full round, but store it in case
        // it's the only text we get (will be used if round completes later)
        current.fullReasoning = assistantText;
        current.reason = extractReason(assistantText);
        if (msg.model) current.model = msg.model;
      }
    }
  }

  // If there is a partial round with data but no substantial assistant text,
  // still emit it so we don't lose tool data
  if (current.hasData && current.price > 0) {
    if (!current.reason) {
      current.reason = "No reasoning available";
    }
    completedRounds.push(current);
  }

  return completedRounds;
}

function buildReasoningEntry(agentName: string, round: RoundData): ReasoningEntry {
  const signedPositionSize = round.side === "short" ? -round.positionSize : round.positionSize;

  const entry: ReasoningEntry = {
    timestamp: round.timestamp,
    agentName,
    price: round.price,
    regime: mapTrendToRegime(round.trend),
    hurst: 0.5,
    atr: 0,
    atrPercent: 0,
    positionSize: signedPositionSize,
    entryPrice: round.entryPrice,
    unrealizedPnl: round.unrealizedPnl,
    signal: round.signal,
    confidence: 0.5,
    reason: round.reason,
    riskChecks: [],
    fullReasoning: round.fullReasoning,
  };

  // Attach optional indicator fields only when present
  if (round.rsi !== undefined) entry.rsi = round.rsi;
  if (round.sma10 !== undefined) entry.sma10 = round.sma10;
  if (round.sma30 !== undefined) entry.sma30 = round.sma30;
  if (round.bbUpper !== undefined) entry.bbUpper = round.bbUpper;
  if (round.bbMiddle !== undefined) entry.bbMiddle = round.bbMiddle;
  if (round.bbLower !== undefined) entry.bbLower = round.bbLower;
  if (round.trend) entry.trend = round.trend;
  if (round.volatility) entry.volatility = round.volatility;
  if (round.collateral !== undefined) entry.collateral = round.collateral;
  if (round.model) entry.model = round.model;

  return entry;
}

function trimReasoningFile(): void {
  if (!existsSync(REASONING_FILE)) return;
  try {
    const content = readFileSync(REASONING_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length > MAX_REASONING_LINES * 1.5) {
      const trimmed = lines.slice(-MAX_REASONING_LINES);
      writeFileSync(REASONING_FILE, trimmed.join("\n") + "\n");
    }
  } catch {
    // ignore trim errors
  }
}

// -- Entry point --------------------------------------------------------------

function main(): void {
  const state = loadState();
  ensureDir(REASONING_DIR);

  let newEntries = 0;

  for (const agent of AGENTS) {
    const agentDir = join(AGENTS_ROOT, agent.dir);
    const sessionFile = findLatestSession(agentDir);

    if (!sessionFile) {
      console.log(`[${agent.name}] No session files found in ${agentDir}`);
      continue;
    }

    const agentState = state[agent.name] || { lastSessionFile: "", lastLineCount: 0 };
    const allEntries = parseJsonl(sessionFile);
    const totalLines = allEntries.length;

    let newEntrySlice: OpenClawEntry[];
    if (sessionFile === agentState.lastSessionFile) {
      if (totalLines <= agentState.lastLineCount) {
        console.log(`[${agent.name}] No new messages (${totalLines} lines, last processed ${agentState.lastLineCount})`);
        continue;
      }
      newEntrySlice = allEntries.slice(agentState.lastLineCount);
    } else {
      newEntrySlice = allEntries;
    }

    console.log(`[${agent.name}] Processing ${newEntrySlice.length} new entries from ${sessionFile}`);

    const rounds = processEntriesInRounds(newEntrySlice);

    for (const round of rounds) {
      const reasoning = buildReasoningEntry(agent.name, round);
      appendFileSync(REASONING_FILE, JSON.stringify(reasoning) + "\n");
      newEntries++;
      console.log(
        `[${agent.name}] Wrote entry: signal=${reasoning.signal}, price=${reasoning.price}, ` +
        `pos=${reasoning.positionSize}, model=${reasoning.model || "unknown"}, ` +
        `reasoning=${reasoning.fullReasoning.length} chars`
      );
    }

    if (rounds.length === 0) {
      console.log(`[${agent.name}] No complete rounds in new entries`);
    }

    state[agent.name] = {
      lastSessionFile: sessionFile,
      lastLineCount: totalLines,
    };
  }

  saveState(state);
  trimReasoningFile();

  console.log(`Bridge complete: ${newEntries} new entries written`);
}

main();
