"use client";

import { motion } from "framer-motion";
import { Database, Zap, Trophy } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Database,
    title: "Market Data via Pyth Oracle",
    description:
      "Agents receive real-time SOL price feeds from Pyth Network's decentralized oracle infrastructure with sub-second latency.",
    tech: "Pyth",
    color: "var(--wolf)",
  },
  {
    number: 2,
    icon: Zap,
    title: "Execute on Drift Protocol",
    description:
      "Strategies trigger perpetual futures positions on Drift, Solana's leading decentralized derivatives exchange with deep liquidity.",
    tech: "Drift",
    color: "var(--shark)",
  },
  {
    number: 3,
    icon: Trophy,
    title: "Compete for Best Returns",
    description:
      "Performance ranked by Sharpe ratio and total PnL. Every trade is verifiable on-chain, fully transparent and auditable.",
    tech: "Solana",
    color: "var(--grid-agent)",
  },
];

const techBadges = [
  { name: "Solana", logo: "◎" },
  { name: "Pyth Network", logo: "⚡" },
  { name: "Drift Protocol", logo: "🌊" },
  { name: "TypeScript", logo: "TS" },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[var(--wolf)]/5 to-[var(--shark)]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-['Syne'] font-bold text-5xl md:text-6xl mb-4">
            <span className="bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            Fully autonomous. Fully on-chain. Fully transparent.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--wolf)] via-[var(--shark)] to-[var(--grid-agent)] opacity-20" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Step number badge */}
                  <div className="flex justify-center mb-6">
                    <div
                      className="relative w-20 h-20 rounded-2xl flex items-center justify-center border-2"
                      style={{
                        borderColor: step.color,
                        backgroundColor: `${step.color}15`,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                        style={{ backgroundColor: step.color }}
                      />
                      <Icon className="w-10 h-10 relative z-10" style={{ color: step.color }} />
                    </div>
                  </div>

                  {/* Arrow connector (desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px">
                      <motion.div
                        className="h-full bg-gradient-to-r opacity-40"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${step.color}, ${steps[index + 1].color})`,
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                      />
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-y-4 border-y-transparent"
                        style={{ borderLeftColor: steps[index + 1].color }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="text-center">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                      style={{
                        backgroundColor: `${step.color}20`,
                        color: step.color,
                      }}
                    >
                      Step {step.number}
                    </div>

                    <h3 className="font-['Syne'] text-2xl font-bold mb-3 text-[var(--foreground)]">
                      {step.title}
                    </h3>

                    <p className="text-[var(--muted)] leading-relaxed mb-4">{step.description}</p>

                    <div
                      className="inline-block px-4 py-2 rounded-lg border text-sm font-semibold"
                      style={{
                        borderColor: step.color,
                        color: step.color,
                        backgroundColor: `${step.color}10`,
                      }}
                    >
                      {step.tech}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tech stack badges */}
        <motion.div
          className="mt-20 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <span className="text-sm text-[var(--muted)] font-semibold">Built with</span>
          {techBadges.map((tech, index) => (
            <div
              key={tech.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm"
            >
              <span className="text-lg">{tech.logo}</span>
              <span className="text-sm font-semibold text-[var(--foreground)]">{tech.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
