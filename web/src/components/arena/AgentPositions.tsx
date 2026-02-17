"use client";

import { cn } from "@/lib/utils";
import { AGENTS } from "@/config/agents";
import { useAgentStore } from "@/stores/useAgentStore";

export function AgentPositions() {
  const agents = useAgentStore((s) => s.agents);

  const positions = AGENTS.map((a) => ({
    ...a,
    pos: agents[a.id]?.position,
  })).filter((a) => a.pos && a.pos.baseSize !== 0);

  if (positions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border border-border-2 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-2">
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-xs text-muted-2">No open positions</span>
        <span className="text-[9px] text-muted-2/60">Agents are evaluating the market</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[9px] text-muted-2 uppercase tracking-wider">
            <th className="text-left pl-5 pr-2 py-2.5 font-medium">Agent</th>
            <th className="text-left px-2 py-2.5 font-medium">Side</th>
            <th className="text-right px-2 py-2.5 font-medium">Size</th>
            <th className="text-right px-2 py-2.5 font-medium">Entry</th>
            <th className="text-right px-2 py-2.5 font-medium">Leverage</th>
            <th className="text-right pr-5 pl-2 py-2.5 font-medium">uPnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((agent) => {
            const pos = agent.pos!;
            const isLong = pos.baseSize > 0;
            return (
              <tr
                key={agent.id}
                className="border-t border-border/40 hover:bg-surface-2/50 transition-colors"
              >
                <td className="pl-5 pr-2 py-3">
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
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase px-2 py-0.5 rounded",
                      isLong ? "bg-green/10 text-green" : "bg-red/10 text-red"
                    )}
                  >
                    {isLong ? "Long" : "Short"}
                  </span>
                </td>
                <td className="px-2 py-3 text-right">
                  <span className="text-xs text-foreground tabular-nums font-medium">
                    {Math.abs(pos.baseSize).toFixed(4)} <span className="text-muted text-[10px]">SOL</span>
                  </span>
                </td>
                <td className="px-2 py-3 text-right">
                  <span className="text-xs text-foreground-2 tabular-nums">${pos.entryPrice.toFixed(2)}</span>
                </td>
                <td className="px-2 py-3 text-right">
                  <span className="text-xs text-foreground-2 tabular-nums">{pos.leverage.toFixed(1)}x</span>
                </td>
                <td className="pr-5 pl-2 py-3 text-right">
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      pos.unrealizedPnl > 0 ? "text-green" : pos.unrealizedPnl < 0 ? "text-red" : "text-muted"
                    )}
                  >
                    {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
