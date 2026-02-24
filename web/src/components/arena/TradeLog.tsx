"use client";

import { cn } from "@/lib/utils";
import { useTradeLogStore } from "@/stores/useTradeLogStore";
import { AGENTS } from "@/config/agents";

function getAgentColor(agentId: string): string {
  return AGENTS.find((a) => a.id === agentId)?.color ?? "#5a6b80";
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function TradeLog() {
  const entries = useTradeLogStore((s) => s.entries);

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-muted-2 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-1 rounded-full bg-muted-2 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1 h-1 rounded-full bg-muted-2 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-xs text-muted-2">Waiting for agent activity</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto scrollbar-none">
      {entries.map((entry) => {
        const agentColor = getAgentColor(entry.agentId);
        return (
          <div
            key={entry.id}
            className="trade-entry flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 border-b border-border/30 last:border-0 hover:bg-surface-2/30 transition-colors min-w-0"
          >
            {/* Agent dot */}
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: agentColor, boxShadow: `0 0 4px ${agentColor}50` }}
            />

            {/* Agent name */}
            <span
              className="text-[10px] font-semibold w-10 flex-shrink-0 font-display"
              style={{ color: agentColor }}
            >
              {entry.agentName}
            </span>

            {/* Direction badge */}
            <span
              className={cn(
                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0",
                entry.direction === "long"
                  ? "bg-green/10 text-green"
                  : entry.direction === "short"
                    ? "bg-red/10 text-red"
                    : "bg-cyan/10 text-cyan"
              )}
            >
              {entry.direction}
            </span>

            {/* Size & price */}
            <span className="text-[10px] text-foreground-2 tabular-nums flex-shrink-0 hidden sm:inline">
              {entry.size.toFixed(4)} <span className="text-muted-2">@</span> ${entry.price.toFixed(2)}
            </span>

            {/* Reason */}
            <span className="text-[10px] text-muted-2 truncate flex-1 text-right italic min-w-0">
              {entry.reason}
            </span>

            {/* Time */}
            <span className="text-[9px] text-muted-2/60 tabular-nums flex-shrink-0 w-8 text-right">
              {timeAgo(entry.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
