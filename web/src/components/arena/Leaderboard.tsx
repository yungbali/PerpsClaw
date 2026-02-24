"use client";

import { cn } from "@/lib/utils";
import { AGENTS } from "@/config/agents";
import { useAgentStore } from "@/stores/useAgentStore";

const RANK_LABELS = ["1st", "2nd", "3rd"];

export function Leaderboard() {
  const agents = useAgentStore((s) => s.agents);

  const ranked = [...AGENTS]
    .map((a) => ({
      ...a,
      pnl: agents[a.id]?.cumulativePnl ?? 0,
      trades: agents[a.id]?.totalTrades ?? 0,
      winRate: agents[a.id]?.winRate ?? 0,
      isActive: agents[a.id]?.isActive ?? false,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="h-full overflow-auto">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="text-[9px] text-muted-2 uppercase tracking-wider">
            <th className="text-left pl-5 pr-2 py-2.5 font-medium">Rank</th>
            <th className="text-left px-2 py-2.5 font-medium">Agent</th>
            <th className="text-left px-2 py-2.5 font-medium">Strategy</th>
            <th className="text-right px-2 py-2.5 font-medium">PnL</th>
            <th className="text-right px-2 py-2.5 font-medium">Trades</th>
            <th className="text-right pr-5 px-2 py-2.5 font-medium">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((agent, i) => (
            <tr
              key={agent.id}
              className="border-t border-border/40 hover:bg-surface-2/50 transition-colors"
            >
              <td className="pl-5 pr-2 py-3">
                <span className={cn("text-xs font-bold font-display", `rank-${i + 1}`)}>
                  {RANK_LABELS[i]}
                </span>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: agent.color, boxShadow: `0 0 6px ${agent.color}40` }}
                  />
                  <span className="text-xs font-semibold text-foreground font-display">
                    {agent.name}
                  </span>
                </div>
              </td>
              <td className="px-2 py-3">
                <span className="text-[10px] text-muted">{agent.strategy}</span>
              </td>
              <td className="px-2 py-3 text-right">
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums",
                    agent.pnl > 0 ? "text-green" : agent.pnl < 0 ? "text-red" : "text-muted-2"
                  )}
                >
                  {agent.pnl >= 0 ? "+" : ""}${agent.pnl.toFixed(2)}
                </span>
              </td>
              <td className="px-2 py-3 text-right">
                <span className="text-xs text-foreground-2 tabular-nums">{agent.trades}</span>
              </td>
              <td className="pr-5 px-2 py-3 text-right">
                <span className="text-xs text-foreground-2 tabular-nums">
                  {agent.winRate > 0 ? `${agent.winRate.toFixed(0)}%` : "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
