"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AgentInfo } from "@/config/agents";
import { useAgentStore, AgentStats } from "@/stores/useAgentStore";

interface AgentCardProps {
  agent: AgentInfo;
  rank: number;
}

const AGENT_ICONS: Record<string, string> = {
  shark: "M12 2C8 6 4 10 4 14c0 4 3.5 8 8 8s8-4 8-8c0-4-4-8-8-12zm0 4l3 5h-6l3-5z",
  wolf: "M12 2L8 7l-4 1 2 4-1 5 7-2 7 2-1-5 2-4-4-1-4-5zm0 5a3 3 0 110 6 3 3 0 010-6z",
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
};

export function AgentCard({ agent, rank }: AgentCardProps) {
  const stats = useAgentStore((s) => s.agents[agent.id]) as AgentStats;
  const pos = stats?.position;
  const pnl = pos?.unrealizedPnl ?? 0;
  const isLong = (pos?.baseSize ?? 0) > 0;
  const isShort = (pos?.baseSize ?? 0) < 0;
  const hasPosition = isLong || isShort;

  return (
    <Link
      href={`/arena/${agent.id}`}
      className="relative group rounded-lg overflow-hidden fade-up block cursor-pointer"
      style={{ animationDelay: `${rank * 80}ms` }}
    >
      {/* Shimmer top line */}
      <div
        className="agent-shimmer"
        style={{ "--shimmer-color": agent.color } as React.CSSProperties}
      />

      {/* Glow border on hover */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: `inset 0 0 0 1px ${agent.color}30, 0 0 20px ${agent.color}08`,
        }}
      />

      {/* Card body */}
      <div className="relative bg-surface border border-border rounded-lg p-4 h-full flex flex-col">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Agent icon with color glow */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${agent.color}15` }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: agent.color }}>
                  <path d={AGENT_ICONS[agent.id]} fill="currentColor" fillOpacity="0.9" />
                </svg>
              </div>
              <div
                className="absolute -inset-1 rounded-lg blur-md opacity-30"
                style={{ backgroundColor: agent.color }}
              />
            </div>
            <div>
              <h3 className="font-display text-sm font-700 text-foreground leading-none">
                {agent.name}
              </h3>
              <p className="text-[9px] text-muted mt-0.5 uppercase tracking-wider">{agent.strategy}</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                stats?.isActive ? "breathe" : ""
              )}
              style={{ backgroundColor: stats?.isActive ? agent.color : "#3a4a5c" }}
            />
            <span className="text-[9px] uppercase tracking-wider" style={{ color: stats?.isActive ? agent.color : "#3a4a5c" }}>
              {stats?.isActive ? "Active" : "Idle"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border mb-3" />

        {/* Position */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-2 uppercase tracking-wider">Position</span>
          {hasPosition ? (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded",
                  isLong ? "bg-green/10 text-green" : "bg-red/10 text-red"
                )}
              >
                {isLong ? "Long" : "Short"}
              </span>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {Math.abs(pos!.baseSize).toFixed(4)}
              </span>
              <span className="text-[10px] text-muted">SOL</span>
            </div>
          ) : (
            <span className="text-xs text-muted-2">No position</span>
          )}
        </div>

        {/* PnL — the hero number */}
        <div
          className="flex items-center justify-between py-2 px-3 rounded-md mb-2"
          style={{ backgroundColor: `${agent.color}06` }}
        >
          <span className="text-[10px] text-muted-2 uppercase tracking-wider">PnL</span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums font-display",
              pnl > 0 ? "text-green" : pnl < 0 ? "text-red" : "text-muted"
            )}
          >
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </span>
        </div>

        {/* Stats row */}
        {hasPosition && (
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-2 uppercase tracking-wider">Entry</span>
              <span className="text-2xs font-medium text-foreground-2 tabular-nums">
                ${(pos?.entryPrice ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-muted-2 uppercase tracking-wider">Leverage</span>
              <span className="text-2xs font-medium text-foreground-2 tabular-nums">
                {(pos?.leverage ?? 0).toFixed(1)}x
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
