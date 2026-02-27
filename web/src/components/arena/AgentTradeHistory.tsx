"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTradeLogStore } from "@/stores/useTradeLogStore";

interface Props {
  agentId: string;
  agentColor: string;
}

export function AgentTradeHistory({ agentId, agentColor }: Props) {
  const allEntries = useTradeLogStore((s) => s.entries);
  const entries = useMemo(() => allEntries.filter((e) => e.agentId === agentId), [allEntries, agentId]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-muted text-sm">No trades recorded yet</div>
        <p className="text-xs text-muted-2">Trades will appear here once the agent starts executing.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-border text-[10px] text-muted-2 uppercase tracking-wider">
            <th className="text-left px-6 py-3 font-medium">Time</th>
            <th className="text-left px-4 py-3 font-medium">Direction</th>
            <th className="text-right px-4 py-3 font-medium">Size</th>
            <th className="text-right px-4 py-3 font-medium">Price</th>
            <th className="text-left px-4 py-3 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {entries.map((entry) => {
            const time = new Date(entry.timestamp);
            const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

            return (
              <tr key={entry.id} className="hover:bg-surface-2/20 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: agentColor }}
                    />
                    <div className="text-xs text-muted tabular-nums">
                      <span>{dateStr}</span>
                      <span className="text-muted-2/40 mx-1">|</span>
                      <span>{timeStr}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                      entry.direction === "long"
                        ? "bg-green/10 text-green"
                        : entry.direction === "short"
                          ? "bg-red/10 text-red"
                          : "bg-cyan/10 text-cyan"
                    )}
                  >
                    {entry.direction}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {entry.size.toFixed(4)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-xs text-foreground-2 tabular-nums">
                    ${entry.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs text-muted-2 italic line-clamp-1">
                    {entry.reason}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
