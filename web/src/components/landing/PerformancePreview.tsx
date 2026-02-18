"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAgentStore } from "@/stores/useAgentStore";
import { AGENTS } from "@/config/agents";
import { ArrowRight, Trophy, TrendingUp } from "lucide-react";

export function PerformancePreview() {
  const agentStats = useAgentStore((state) => state.agents);

  // Create leaderboard sorted by PnL
  const leaderboard = AGENTS.map((agent) => ({
    ...agent,
    stats: agentStats[agent.id],
  }))
    .sort((a, b) => (b.stats?.cumulativePnl ?? 0) - (a.stats?.cumulativePnl ?? 0))
    .map((agent, index) => ({ ...agent, rank: index + 1 }));

  return (
    <section id="performance" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--green)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-[var(--red)]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-['Syne'] font-bold text-5xl md:text-6xl mb-4">
            <span className="bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
              Live Performance
            </span>
          </h2>
          <p className="text-xl text-[var(--muted)]">Real-time rankings updated every trade</p>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          className="relative p-8 rounded-3xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 pb-4 mb-6 border-b border-[var(--border)] text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Agent</div>
            <div className="col-span-3 text-right">PnL</div>
            <div className="col-span-3 text-right">Win Rate</div>
          </div>

          {/* Leaderboard rows */}
          <div className="space-y-4">
            {leaderboard.map((agent, index) => {
              const pnl = agent.stats?.cumulativePnl ?? 0;
              const winRate = agent.stats?.winRate ?? 0;

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="group grid grid-cols-12 gap-4 items-center p-4 rounded-xl bg-[var(--surface-2)]/50 border border-transparent hover:border-[var(--border-2)] transition-all duration-300"
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      {agent.rank === 1 && <Trophy className="w-5 h-5 text-[#ffd700]" />}
                      {agent.rank === 2 && <Trophy className="w-5 h-5 text-[#c0c0c0]" />}
                      {agent.rank === 3 && <Trophy className="w-5 h-5 text-[#cd7f32]" />}
                      <span className="font-['Syne'] font-bold text-lg text-[var(--muted)]">
                        {agent.rank}
                      </span>
                    </div>
                  </div>

                  {/* Agent */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{
                        borderColor: agent.color,
                        backgroundColor: `${agent.color}15`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                    </div>
                    <div>
                      <div className="font-['Syne'] font-bold text-[var(--foreground)]">
                        {agent.name}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{agent.strategy}</div>
                    </div>
                  </div>

                  {/* PnL */}
                  <div className="col-span-3 text-right">
                    <div
                      className={`font-['Syne'] font-bold text-lg ${
                        pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-3 text-right">
                    <div className="font-['Syne'] font-bold text-lg text-[var(--foreground)]">
                      {(winRate * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Accent line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: agent.color }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Shimmer effect */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden opacity-30">
            <div
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[var(--green)] to-transparent"
              style={{ animation: "shimmer-line 3s ease-in-out infinite" }}
            />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/arena">
            <button className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-[var(--shark)] to-[var(--wolf)] font-['Syne'] font-bold text-xl text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,107,53,0.4)] hover:scale-105">
              <span className="relative z-10 flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                Enter the Arena
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
          </Link>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Watch live trades, analyze strategies, and track real-time performance
          </p>
        </motion.div>
      </div>
    </section>
  );
}
