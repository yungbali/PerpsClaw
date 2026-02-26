"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ReasoningEntry {
  timestamp: number;
  agentName: string;
  price: number;
  regime: string;
  positionSize: number;
  entryPrice: number;
  unrealizedPnl: number;
  signal: string;
  reason: string;
  fullReasoning?: string;
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

interface Props {
  agentId: string;
  agentColor: string;
}

export function AgentReasoning({ agentId, agentColor }: Props) {
  const [entries, setEntries] = useState<ReasoningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const fetchReasoning = async () => {
      try {
        const res = await fetch(`/api/reasoning?agent=${agentId}&limit=50`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReasoning();
    const interval = setInterval(fetchReasoning, 10000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Auto-scroll to top when new entries arrive (most recent first)
  useEffect(() => {
    if (autoScrollRef.current && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <div className="relative">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: agentColor }} />
          <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-30" style={{ backgroundColor: agentColor }} />
        </div>
        <span className="text-muted text-xs uppercase tracking-widest">Connecting to agent feed...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="text-muted text-sm font-medium">No reasoning data yet</div>
        <p className="text-xs text-muted-2 max-w-sm text-center">
          The agent needs to complete at least one analysis cycle. Data will appear automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between px-4 md:px-5 py-2 bg-surface-2/40 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green/60" />
          </div>
          <span className="text-[10px] text-muted-2 uppercase tracking-widest">
            reasoning feed
          </span>
        </div>
        <div className="flex items-center gap-3">
          {entries[0]?.model && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-surface-3 text-muted-2 font-medium">
              {entries[0].model.split("/").pop()}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: agentColor }}
            />
            <span className="text-[9px] text-muted-2 uppercase tracking-wider">
              {entries.length} entries
            </span>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-auto"
        onScroll={() => {
          if (feedRef.current) {
            autoScrollRef.current = feedRef.current.scrollTop < 50;
          }
        }}
      >
        {entries.map((entry, i) => {
          const entryKey = `${entry.timestamp}-${i}`;
          const isExpanded = expandedId === entryKey;
          const time = new Date(entry.timestamp);
          const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });
          const hasFullReasoning = entry.fullReasoning && entry.fullReasoning.length > 0;

          return (
            <div
              key={entryKey}
              className={cn(
                "border-b border-border/20 transition-colors",
                isExpanded ? "bg-surface-2/30" : "hover:bg-surface-2/15"
              )}
            >
              {/* Compact row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : entryKey)}
                className="w-full text-left px-4 md:px-5 py-3 flex items-start gap-3"
              >
                {/* Timestamp column */}
                <div className="flex-shrink-0 w-28 md:w-32">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-2 tabular-nums">{dateStr}</span>
                    <span className="text-muted-2/30">|</span>
                    <span className="text-[10px] text-muted tabular-nums">{timeStr}</span>
                  </div>
                </div>

                {/* Signal badge */}
                <div className="flex-shrink-0">
                  <SignalBadge signal={entry.signal} />
                </div>

                {/* Price + indicators compact */}
                <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-foreground tabular-nums font-medium">
                    ${entry.price.toFixed(2)}
                  </span>

                  {entry.trend && (
                    <TrendBadge trend={entry.trend} />
                  )}

                  {entry.rsi !== undefined && (
                    <span className={cn(
                      "text-[10px] tabular-nums",
                      entry.rsi > 70 ? "text-red" : entry.rsi < 30 ? "text-green" : "text-muted"
                    )}>
                      RSI {entry.rsi.toFixed(0)}
                    </span>
                  )}

                  {entry.positionSize !== 0 && (
                    <span className={cn(
                      "text-[10px] tabular-nums font-medium",
                      entry.unrealizedPnl >= 0 ? "text-green" : "text-red"
                    )}>
                      PnL {entry.unrealizedPnl >= 0 ? "+" : ""}${entry.unrealizedPnl.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Expand indicator */}
                {hasFullReasoning && (
                  <div className="flex-shrink-0">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={cn(
                        "text-muted-2 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Expanded reasoning */}
              {isExpanded && (
                <div className="px-4 md:px-5 pb-4">
                  {/* Indicator bar */}
                  <IndicatorBar entry={entry} agentColor={agentColor} />

                  {/* Full reasoning text */}
                  {hasFullReasoning ? (
                    <div className="mt-3 pl-3 border-l-2 border-border/40">
                      <ReasoningText text={entry.fullReasoning!} agentColor={agentColor} />
                    </div>
                  ) : (
                    <div className="mt-3 pl-3 border-l-2 border-border/40">
                      <p className="text-xs text-muted-2 italic">{entry.reason}</p>
                    </div>
                  )}

                  {/* Position details */}
                  {entry.positionSize !== 0 && (
                    <div className="mt-3 flex items-center gap-4 text-[10px] text-muted pl-3">
                      <span className="tabular-nums">
                        Pos: {entry.positionSize > 0 ? "+" : ""}{entry.positionSize.toFixed(4)}
                      </span>
                      <span className="tabular-nums">
                        Entry: ${entry.entryPrice.toFixed(2)}
                      </span>
                      {entry.collateral !== undefined && (
                        <span className="tabular-nums">
                          Collateral: ${entry.collateral.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* OpenClaw attribution */}
        <div className="flex items-center justify-center gap-2 py-6 text-muted-2/50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-[9px] uppercase tracking-[0.2em]">Powered by OpenClaw</span>
        </div>
      </div>
    </div>
  );
}

// -- Sub-components --

function SignalBadge({ signal }: { signal: string }) {
  const styles: Record<string, string> = {
    long: "bg-green/10 text-green",
    short: "bg-red/10 text-red",
    close: "bg-cyan/10 text-cyan",
    none: "bg-surface-3 text-muted-2",
  };

  return (
    <span className={cn(
      "inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider w-12 text-center",
      styles[signal] || styles.none
    )}>
      {signal}
    </span>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  const arrow = trend === "bullish" ? "\u2191" : trend === "bearish" ? "\u2193" : "\u2194";
  const color = trend === "bullish" ? "text-green" : trend === "bearish" ? "text-red" : "text-muted-2";

  return (
    <span className={cn("text-[10px] uppercase tracking-wider", color)}>
      {arrow} {trend}
    </span>
  );
}

function IndicatorBar({ entry, agentColor }: { entry: ReasoningEntry; agentColor: string }) {
  const hasIndicators = entry.sma10 !== undefined || entry.bbUpper !== undefined || entry.rsi !== undefined;
  if (!hasIndicators && entry.volatility === undefined) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted tabular-nums">
      {entry.sma10 !== undefined && (
        <span>SMA10: {entry.sma10.toFixed(2)}</span>
      )}
      {entry.sma30 !== undefined && (
        <span>SMA30: {entry.sma30.toFixed(2)}</span>
      )}
      {entry.bbUpper !== undefined && entry.bbMiddle !== undefined && entry.bbLower !== undefined && (
        <span>
          BB: {entry.bbLower.toFixed(2)}/{entry.bbMiddle.toFixed(2)}/{entry.bbUpper.toFixed(2)}
        </span>
      )}
      {entry.rsi !== undefined && (
        <span className={cn(
          entry.rsi > 70 ? "text-red" : entry.rsi < 30 ? "text-green" : ""
        )}>
          RSI: {entry.rsi.toFixed(1)}
        </span>
      )}
      {entry.volatility && (
        <span className="uppercase"
          style={{ color: entry.volatility === "high" ? "var(--red)" : entry.volatility === "low" ? agentColor : undefined }}
        >
          Vol: {entry.volatility}
        </span>
      )}
    </div>
  );
}

function ReasoningText({ text, agentColor }: { text: string; agentColor: string }) {
  // Parse the markdown-ish text into styled blocks
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        // Headers (** at start)
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={i} className="text-xs font-semibold text-foreground mt-2 first:mt-0" style={{ color: agentColor }}>
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }

        // Bold headers like **Text:**
        if (trimmed.match(/^\*\*[^*]+\*\*:?$/)) {
          return (
            <p key={i} className="text-xs font-semibold text-foreground mt-2 first:mt-0" style={{ color: agentColor }}>
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }

        // Bullet points
        if (trimmed.startsWith("*   ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.replace(/^[*-]\s+/, "");
          return (
            <div key={i} className="flex gap-2 text-[11px] text-foreground-2 leading-relaxed pl-2">
              <span className="text-muted-2/40 flex-shrink-0">{"\u25b8"}</span>
              <span>
                <InlineFormatted text={content} />
              </span>
            </div>
          );
        }

        // Regular text (may contain inline bold like **text**)
        return (
          <p key={i} className="text-[11px] text-foreground-2 leading-relaxed">
            <InlineFormatted text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

function InlineFormatted({ text }: { text: string }) {
  // Split on **bold** and `code` patterns
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="text-cyan text-[10px] px-1 py-0.5 rounded bg-surface-3">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
