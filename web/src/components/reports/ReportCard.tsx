"use client";

import type { Report } from "./ReportsFeed";

const AGENT_META: Record<string, { name: string; color: string; icon: string }> = {
  shark: { name: "Shark", color: "#ff6b35", icon: "🦈" },
  wolf: { name: "Wolf", color: "#8b5cf6", icon: "🐺" },
  grid: { name: "Grid", color: "#06b6d4", icon: "⚡" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TrendBadge({ trend, volatility }: { trend: string; volatility: string }) {
  const trendColor =
    trend === "bullish"
      ? "text-[var(--green)] bg-[var(--green)]/10"
      : trend === "bearish"
      ? "text-[var(--red)] bg-[var(--red)]/10"
      : "text-[var(--muted)] bg-[var(--surface-2)]";

  const volColor =
    volatility === "high"
      ? "text-[var(--shark)] bg-[var(--shark)]/10"
      : volatility === "medium"
      ? "text-[var(--wolf)] bg-[var(--wolf)]/10"
      : "text-[var(--muted)] bg-[var(--surface-2)]";

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${trendColor}`}>
        {trend}
      </span>
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${volColor}`}>
        {volatility} vol
      </span>
    </div>
  );
}

function AgentRow({
  agentId,
  data,
}: {
  agentId: string;
  data: any;
}) {
  const meta = AGENT_META[agentId] || {
    name: agentId,
    color: "#888",
    icon: "🤖",
  };

  if (data.error) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]/50">
        <span className="text-lg">{meta.icon}</span>
        <span className="font-semibold" style={{ color: meta.color }}>
          {meta.name}
        </span>
        <span className="text-sm text-[var(--red)]">Error: {data.error}</span>
      </div>
    );
  }

  const pnl = data.unrealizedPnl ?? 0;
  const pnlColor = pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]";

  return (
    <div
      className="p-3 rounded-lg bg-[var(--surface-2)]/50 border-l-2"
      style={{ borderLeftColor: meta.color }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <span className="font-['Syne'] font-bold" style={{ color: meta.color }}>
            {meta.name}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              data.position === "flat"
                ? "text-[var(--muted)] bg-[var(--surface)]"
                : data.position === "long"
                ? "text-[var(--green)] bg-[var(--green)]/10"
                : "text-[var(--red)] bg-[var(--red)]/10"
            }`}
          >
            {data.position === "flat"
              ? "FLAT"
              : `${data.position.toUpperCase()} ${data.positionSize} SOL`}
          </span>
        </div>
        <span className={`font-['Syne'] font-bold text-sm ${pnlColor}`}>
          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs text-[var(--muted)]">
        <div>
          <span className="block text-[var(--muted-2)]">Collateral</span>
          <span className="text-[var(--foreground)] font-medium">
            ${data.driftCollateral?.toFixed(2) ?? "—"}
          </span>
        </div>
        <div>
          <span className="block text-[var(--muted-2)]">Wallet SOL</span>
          <span className="text-[var(--foreground)] font-medium">
            {data.walletSol?.toFixed(3) ?? "—"}
          </span>
        </div>
        {data.position !== "flat" && (
          <div>
            <span className="block text-[var(--muted-2)]">Entry</span>
            <span className="text-[var(--foreground)] font-medium">
              ${data.entryPrice?.toFixed(2) ?? "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReportCard({
  report,
  isLatest,
}: {
  report: Report;
  isLatest: boolean;
}) {
  const { market } = report;

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div
        className={`absolute left-3 top-6 w-3 h-3 rounded-full border-2 border-[var(--background)] ${
          isLatest ? "bg-[var(--green)] animate-pulse" : "bg-[var(--muted-2)]"
        }`}
      />

      <div className="p-6 rounded-2xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-['Syne'] font-bold text-lg text-[var(--foreground)]">
              {formatTime(report.timestamp)}
            </span>
            {isLatest && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold text-[var(--green)] bg-[var(--green)]/10">
                Latest
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--muted)]">
            {timeAgo(report.timestamp)}
          </span>
        </div>

        {/* Market summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]/50 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-[var(--muted-2)] block">SOL</span>
              <span className="font-['Syne'] font-bold text-xl text-[var(--foreground)]">
                ${market.price?.toFixed(2) ?? "—"}
              </span>
            </div>
            {market.rsi14 !== null && (
              <div>
                <span className="text-xs text-[var(--muted-2)] block">RSI</span>
                <span className="font-medium text-sm text-[var(--foreground)]">
                  {market.rsi14.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <TrendBadge trend={market.trend} volatility={market.volatility} />
        </div>

        {/* Agent rows */}
        <div className="space-y-2">
          {Object.entries(report.agents).map(([id, data]) => (
            <AgentRow key={id} agentId={id} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}
