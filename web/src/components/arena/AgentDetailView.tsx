"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AgentInfo } from "@/config/agents";
import { useAgentStore, AgentStats } from "@/stores/useAgentStore";
import { useTradeLogStore } from "@/stores/useTradeLogStore";
import { usePriceStore } from "@/stores/usePriceStore";
import { AgentReasoning } from "./AgentReasoning";
import { AgentTradeHistory } from "./AgentTradeHistory";

const AGENT_ICONS: Record<string, string> = {
  shark: "M12 2C8 6 4 10 4 14c0 4 3.5 8 8 8s8-4 8-8c0-4-4-8-8-12zm0 4l3 5h-6l3-5z",
  wolf: "M12 2L8 7l-4 1 2 4-1 5 7-2 7 2-1-5 2-4-4-1-4-5zm0 5a3 3 0 110 6 3 3 0 010-6z",
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
};

const AGENT_MARKETS: Record<string, { symbol: string; name: string }> = {
  shark: { symbol: "SOL-PERP", name: "Solana" },
  wolf: { symbol: "ETH-PERP", name: "Ethereum" },
  grid: { symbol: "BTC-PERP", name: "Bitcoin" },
};

const tabs = [
  { id: "reasoning", label: "Reasoning" },
  { id: "trades", label: "Trade History" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AgentDetailView({ agent }: { agent: AgentInfo }) {
  const [activeTab, setActiveTab] = useState<TabId>("reasoning");
  const stats = useAgentStore((s) => s.agents[agent.id]) as AgentStats;
  const trades = useTradeLogStore((s) => s.entries.filter((e) => e.agentId === agent.id));
  const price = usePriceStore((s) => s.price);
  const pos = stats?.position;
  const market = AGENT_MARKETS[agent.id];

  const pnl = pos?.unrealizedPnl ?? 0;
  const isLong = (pos?.baseSize ?? 0) > 0;
  const isShort = (pos?.baseSize ?? 0) < 0;
  const hasPosition = isLong || isShort;

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-96 rounded-full blur-[120px] opacity-[0.04]"
          style={{ backgroundColor: agent.color }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-3 md:py-4 bg-surface/80 backdrop-blur-sm border-b border-border gap-3 sm:gap-0">
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/arena"
              className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors text-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Arena
            </Link>
            <div className="w-px h-5 bg-border-2" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${agent.color}15` }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: agent.color }} className="md:w-5 md:h-5">
                    <path d={AGENT_ICONS[agent.id]} fill="currentColor" fillOpacity="0.9" />
                  </svg>
                </div>
                <div
                  className="absolute -inset-1 rounded-xl blur-md opacity-25"
                  style={{ backgroundColor: agent.color }}
                />
              </div>
              <div>
                <h1 className="font-display text-base md:text-lg font-800 text-foreground leading-none">
                  {agent.name}
                </h1>
                <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">{agent.strategy}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-surface-2/50">
              <span className="text-2xs text-muted-2 uppercase tracking-wider hidden sm:inline">Market</span>
              <span className="text-xs font-semibold text-foreground">{market.symbol}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan font-medium">DRIFT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={cn("w-2 h-2 rounded-full", stats?.isActive ? "breathe" : "")}
                style={{ backgroundColor: stats?.isActive ? agent.color : "#3a4a5c" }}
              />
              <span
                className="text-2xs font-medium uppercase tracking-widest"
                style={{ color: stats?.isActive ? agent.color : "#3a4a5c" }}
              >
                {stats?.isActive ? "Live" : "Idle"}
              </span>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4">
          <StatCard
            label="Unrealized PnL"
            value={`${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
            color={pnl > 0 ? "text-green" : pnl < 0 ? "text-red" : "text-muted"}
            accent={agent.color}
          />
          <StatCard
            label="Position"
            value={hasPosition ? `${isLong ? "Long" : "Short"} ${Math.abs(pos!.baseSize).toFixed(4)}` : "No Position"}
            color={hasPosition ? (isLong ? "text-green" : "text-red") : "text-muted-2"}
            accent={agent.color}
          />
          <StatCard
            label="Entry Price"
            value={hasPosition ? `$${(pos?.entryPrice ?? 0).toFixed(2)}` : "—"}
            color="text-foreground"
            accent={agent.color}
          />
          <StatCard
            label="Leverage"
            value={hasPosition ? `${(pos?.leverage ?? 0).toFixed(1)}x` : "—"}
            color="text-foreground"
            accent={agent.color}
          />
          <StatCard
            label="Total Trades"
            value={String(stats?.totalTrades ?? trades.length)}
            color="text-foreground"
            accent={agent.color}
          />
          <StatCard
            label="Win Rate"
            value={`${((stats?.winRate ?? 0) * 100).toFixed(0)}%`}
            color="text-foreground"
            accent={agent.color}
          />
          <StatCard
            label="Cumulative PnL"
            value={`${(stats?.cumulativePnl ?? 0) >= 0 ? "+" : ""}$${(stats?.cumulativePnl ?? 0).toFixed(2)}`}
            color={(stats?.cumulativePnl ?? 0) > 0 ? "text-green" : (stats?.cumulativePnl ?? 0) < 0 ? "text-red" : "text-muted"}
            accent={agent.color}
          />
          <StatCard
            label="Current Price"
            value={price ? `$${price.price.toFixed(2)}` : "..."}
            color="text-foreground"
            accent={agent.color}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border px-4 md:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors",
                activeTab === tab.id ? "text-foreground" : "text-muted-2 hover:text-muted"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: agent.color }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "reasoning" && <AgentReasoning agentId={agent.id} agentColor={agent.color} />}
          {activeTab === "trades" && <AgentTradeHistory agentId={agent.id} agentColor={agent.color} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  accent,
}: {
  label: string;
  value: string;
  color: string;
  accent: string;
}) {
  return (
    <div className="relative bg-surface border border-border rounded-lg p-3 md:p-4 overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }}
      />
      <p className="text-[9px] md:text-[10px] text-muted-2 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("font-display text-sm md:text-base font-700 tabular-nums truncate", color)}>{value}</p>
    </div>
  );
}
