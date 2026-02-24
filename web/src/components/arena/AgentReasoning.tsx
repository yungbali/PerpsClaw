"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

const REGIME_LABELS: Record<string, { label: string; color: string }> = {
  trending: { label: "Trending", color: "text-green" },
  mean_reverting: { label: "Mean Reverting", color: "text-purple" },
  random: { label: "Random", color: "text-muted" },
};

const SIGNAL_STYLES: Record<string, { bg: string; text: string }> = {
  long: { bg: "bg-green/10", text: "text-green" },
  short: { bg: "bg-red/10", text: "text-red" },
  close: { bg: "bg-yellow/10", text: "text-yellow" },
  none: { bg: "bg-surface-3", text: "text-muted" },
};

interface Props {
  agentId: string;
  agentColor: string;
}

export function AgentReasoning({ agentId, agentColor }: Props) {
  const [entries, setEntries] = useState<ReasoningEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted text-sm">Loading reasoning data...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-muted text-sm">No reasoning data yet</div>
        <p className="text-xs text-muted-2">The agent needs to collect candle data before it starts reasoning.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/30">
      {entries.map((entry, i) => {
        const regime = REGIME_LABELS[entry.regime] || { label: entry.regime, color: "text-muted" };
        const signalStyle = SIGNAL_STYLES[entry.signal] || SIGNAL_STYLES.none;
        const time = new Date(entry.timestamp);
        const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

        return (
          <div key={`${entry.timestamp}-${i}`} className="px-6 py-4 hover:bg-surface-2/20 transition-colors">
            {/* Top row: time + regime + signal */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-2">
                  <span>{dateStr}</span>
                  <span className="text-muted-2/40">|</span>
                  <span className="tabular-nums">{timeStr}</span>
                </div>
                <span className={cn("text-[10px] font-medium uppercase px-2 py-0.5 rounded-full", regime.color)}
                  style={{ backgroundColor: `${agentColor}08` }}
                >
                  {regime.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-2">H={entry.hurst.toFixed(2)}</span>
                <span className="text-[10px] text-muted-2">ATR={entry.atrPercent.toFixed(2)}%</span>
              </div>
            </div>

            {/* Decision */}
            <div className="flex items-start gap-3 mb-3">
              <span
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold uppercase flex-shrink-0",
                  signalStyle.bg, signalStyle.text
                )}
              >
                {entry.signal}
              </span>
              <p className="text-sm text-foreground-2 leading-relaxed flex-1">{entry.reason}</p>
              {entry.confidence > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  <div className="w-12 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${entry.confidence * 100}%`,
                        backgroundColor: agentColor,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-2 tabular-nums w-8">
                    {(entry.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {/* Context row */}
            <div className="flex items-center gap-5 text-[10px] text-muted">
              <span className="tabular-nums">Price: ${entry.price.toFixed(2)}</span>
              {entry.positionSize !== 0 && (
                <>
                  <span className="tabular-nums">
                    Pos: {entry.positionSize > 0 ? "+" : ""}{entry.positionSize.toFixed(4)}
                  </span>
                  <span className="tabular-nums">
                    Entry: ${entry.entryPrice.toFixed(2)}
                  </span>
                  <span className={cn("tabular-nums font-medium", entry.unrealizedPnl >= 0 ? "text-green" : "text-red")}>
                    PnL: {entry.unrealizedPnl >= 0 ? "+" : ""}${entry.unrealizedPnl.toFixed(2)}
                  </span>
                </>
              )}
              {entry.riskChecks.length > 0 && (
                <span className="text-yellow flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6z" />
                    <path d="M11 10h2v5h-2zm0 6h2v2h-2z" />
                  </svg>
                  {entry.riskChecks.join(", ")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
