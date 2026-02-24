"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AGENTS } from "@/config/agents";

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

const AGENT_COLORS: Record<string, string> = {
  shark: "#ff4444",
  wolf: "#6644ff",
  grid: "#00ffaa",
};

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

export function ReasoningLog() {
  const [entries, setEntries] = useState<ReasoningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchReasoning = async () => {
      try {
        const url = filter === "all"
          ? "/api/reasoning?limit=30"
          : `/api/reasoning?agent=${filter}&limit=20`;
        const res = await fetch(url);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReasoning();
    const interval = setInterval(fetchReasoning, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted text-sm">Loading reasoning...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 border-b border-border/40 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1 text-xs rounded-full transition-colors",
            filter === "all"
              ? "bg-cyan/10 text-cyan font-medium"
              : "text-muted hover:text-foreground"
          )}
        >
          All
        </button>
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setFilter(agent.id)}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5",
              filter === agent.id
                ? "font-medium"
                : "text-muted hover:text-foreground"
            )}
            style={{
              backgroundColor: filter === agent.id ? `${agent.color}15` : undefined,
              color: filter === agent.id ? agent.color : undefined,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: agent.color }}
            />
            {agent.name}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-auto">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted text-sm">No reasoning data yet</div>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {entries.map((entry, i) => {
              const agentColor = AGENT_COLORS[entry.agentName.toLowerCase()] || "#888";
              const regime = REGIME_LABELS[entry.regime] || { label: entry.regime, color: "text-muted" };
              const signalStyle = SIGNAL_STYLES[entry.signal] || SIGNAL_STYLES.none;
              const timeAgo = formatTimeAgo(entry.timestamp);

              return (
                <div
                  key={`${entry.timestamp}-${entry.agentName}-${i}`}
                  className="px-4 py-3 hover:bg-surface-2/30 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: agentColor }}
                      />
                      <span className="text-xs font-semibold" style={{ color: agentColor }}>
                        {entry.agentName}
                      </span>
                      <span className="text-[10px] text-muted">{timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] uppercase", regime.color)}>
                        {regime.label}
                      </span>
                      <span className="text-[10px] text-muted-2">H={entry.hurst.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Decision row */}
                  <div className="flex items-start gap-3 mb-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                        signalStyle.bg,
                        signalStyle.text
                      )}
                    >
                      {entry.signal}
                    </span>
                    <span className="text-xs text-foreground-2 flex-1">
                      {entry.reason}
                    </span>
                    {entry.confidence > 0 && (
                      <span className="text-[10px] text-muted-2">
                        {(entry.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Context row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
                    <span>Price: ${entry.price.toFixed(2)}</span>
                    <span>ATR: {entry.atrPercent.toFixed(2)}%</span>
                    {entry.positionSize !== 0 && (
                      <>
                        <span>
                          Pos: {entry.positionSize > 0 ? "+" : ""}{entry.positionSize.toFixed(4)}
                        </span>
                        <span className={entry.unrealizedPnl >= 0 ? "text-green" : "text-red"}>
                          PnL: {entry.unrealizedPnl >= 0 ? "+" : ""}${entry.unrealizedPnl.toFixed(2)}
                        </span>
                      </>
                    )}
                    {entry.riskChecks.length > 0 && (
                      <span className="text-yellow">
                        {entry.riskChecks.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
