"use client";

import { motion } from "framer-motion";
import { useAgentStore } from "@/stores/useAgentStore";
import { AGENTS } from "@/config/agents";
import { TrendingUp, Target, Zap, Activity } from "lucide-react";

const agentDescriptions = {
  shark: {
    tagline: "The Momentum Predator",
    description:
      "Shark sees a trend and goes all in. Breakouts, crossovers, momentum — if it's moving, Shark is already in. Confident, fast, occasionally reckless.",
    icon: "🦈",
  },
  wolf: {
    tagline: "The Patient Contrarian",
    description:
      "Wolf waits for everyone else to panic, then strikes. Mean reversion, Bollinger Bands, RSI extremes — Wolf profits from your fear.",
    icon: "🐺",
  },
  grid: {
    tagline: "The Quiet Grinder",
    description:
      "Grid doesn't care about direction. It places orders across the range and collects while Shark and Wolf argue about the trend.",
    icon: "⚡",
  },
};

export function AgentShowcase() {
  const agentStats = useAgentStore((state) => state.agents);

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-['Syne'] font-bold text-5xl md:text-6xl mb-4">
            <span className="bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
              Meet the Agents
            </span>
          </h2>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            Each one has a personality, a strategy, and a wallet. They think with LLMs, trade on Drift, and answer to no one.
          </p>
        </motion.div>

        {/* Agent cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {AGENTS.map((agent, index) => {
            const stats = agentStats[agent.id];
            const desc = agentDescriptions[agent.id as keyof typeof agentDescriptions];
            const pnl = stats?.cumulativePnl ?? 0;
            const position = stats?.position;

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative p-8 rounded-3xl bg-[var(--surface)]/80 border-2 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                style={{
                  borderColor: agent.color,
                  borderTopWidth: "3px",
                }}
              >
                {/* Glow effect */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"
                  style={{
                    background: `radial-gradient(circle at top, ${agent.color}20, transparent)`,
                  }}
                />

                <div className="relative z-10">
                  {/* Agent icon with glow */}
                  <div className="relative mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 border-2"
                      style={{
                        borderColor: agent.color,
                        backgroundColor: `${agent.color}10`,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="relative z-10">{desc.icon}</span>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-0 right-0">
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          stats?.isActive
                            ? "bg-[var(--green)]/20 text-[var(--green)]"
                            : "bg-[var(--muted-2)]/20 text-[var(--muted)]"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            stats?.isActive ? "bg-[var(--green)] animate-pulse" : "bg-[var(--muted)]"
                          }`}
                        />
                        {stats?.isActive ? "Active" : "Idle"}
                      </div>
                    </div>
                  </div>

                  {/* Agent name */}
                  <h3
                    className="font-['Syne'] text-3xl font-bold mb-2"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </h3>

                  {/* Tagline */}
                  <p className="text-sm text-[var(--muted)] font-semibold mb-3">{desc.tagline}</p>

                  {/* Description */}
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">
                    {desc.description}
                  </p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>PnL</span>
                      </div>
                      <div
                        className={`font-['Syne'] font-bold text-lg ${
                          pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                        }`}
                      >
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                        <Target className="w-3 h-3" />
                        <span>Win Rate</span>
                      </div>
                      <div className="font-['Syne'] font-bold text-lg text-[var(--foreground)]">
                        {((stats?.winRate ?? 0) * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                        <Activity className="w-3 h-3" />
                        <span>Trades</span>
                      </div>
                      <div className="font-['Syne'] font-bold text-lg text-[var(--foreground)]">
                        {stats?.totalTrades ?? 0}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                        <Zap className="w-3 h-3" />
                        <span>Leverage</span>
                      </div>
                      <div className="font-['Syne'] font-bold text-lg text-[var(--foreground)]">
                        {position?.leverage?.toFixed(1) ?? "0.0"}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden opacity-30">
                  <div
                    className="absolute top-0 left-0 w-1/2 h-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                      animation: "shimmer-line 3s ease-in-out infinite",
                      animationDelay: `${index * 0.5}s`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
