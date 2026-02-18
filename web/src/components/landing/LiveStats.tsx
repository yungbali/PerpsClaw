"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useAgentStore } from "@/stores/useAgentStore";
import { Activity, TrendingUp, Clock, Users } from "lucide-react";

const DEPLOYMENT_TIMESTAMP = 1737244800000; // Adjust to actual deployment time

function calculateUptime() {
  const now = Date.now();
  const diff = now - DEPLOYMENT_TIMESTAMP;
  return Math.floor(diff / (1000 * 60 * 60)); // hours
}

export function LiveStats() {
  const agents = useAgentStore((state) => state.agents);

  // Calculate totals
  const totalTrades = Object.values(agents).reduce((sum, agent) => sum + agent.totalTrades, 0);
  const cumulativePnl = Object.values(agents).reduce((sum, agent) => sum + agent.cumulativePnl, 0);
  const activeAgents = Object.values(agents).filter((agent) => agent.isActive).length;
  const uptime = calculateUptime();

  const stats = [
    {
      icon: Activity,
      label: "Total Trades",
      value: totalTrades,
      suffix: "",
      color: "var(--cyan)",
    },
    {
      icon: TrendingUp,
      label: "Cumulative PnL",
      value: cumulativePnl,
      prefix: "$",
      decimals: 2,
      color: cumulativePnl >= 0 ? "var(--green)" : "var(--red)",
    },
    {
      icon: Clock,
      label: "Hours Live",
      value: uptime,
      suffix: "h",
      color: "var(--wolf)",
    },
    {
      icon: Users,
      label: "Active Agents",
      value: activeAgents,
      suffix: "/3",
      color: "var(--shark)",
    },
  ];

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-8 rounded-2xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm hover:border-[var(--border-2)] transition-all duration-300 hover:scale-105"
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{
                    background: `radial-gradient(circle at center, ${stat.color}15, transparent)`,
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>

                  <div className="font-['Syne'] text-4xl font-bold mb-2" style={{ color: stat.color }}>
                    {stat.prefix}
                    <CountUp
                      end={stat.value}
                      duration={2}
                      decimals={stat.decimals ?? 0}
                      preserveValue
                    />
                    {stat.suffix}
                  </div>

                  <div className="text-sm text-[var(--muted)] font-medium">{stat.label}</div>
                </div>

                {/* Shimmer effect */}
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden opacity-50">
                  <div
                    className="absolute top-0 left-0 w-1/2 h-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
                      animation: "shimmer-line 3s ease-in-out infinite",
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
