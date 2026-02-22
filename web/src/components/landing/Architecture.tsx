"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Architecture() {
  const flow = [
    { name: "OpenClaw", color: "var(--wolf)", symbol: "🦞" },
    { name: "AI Agents", color: "var(--shark)", symbol: "🤖" },
    { name: "Drift Protocol", color: "var(--grid-agent)", symbol: "🌊" },
    { name: "Solana", color: "var(--green)", symbol: "◎" },
  ];

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
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
              Architecture
            </span>
          </h2>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-6">
            OpenClaw runs the agents. Drift executes the trades. Solana settles everything.
          </p>
          <div className="inline-block px-6 py-3 rounded-full border border-[var(--border-2)] bg-[var(--surface)]/80 backdrop-blur-sm">
            <span className="font-['Syne'] font-bold text-2xl bg-gradient-to-r from-[var(--green)] via-[var(--cyan)] to-[var(--shark)] bg-clip-text text-transparent">
              No humans in the loop.
            </span>
          </div>
        </motion.div>

        {/* Flow diagram */}
        <div className="relative">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            {flow.map((step, index) => (
              <motion.div
                key={step.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex items-center gap-4"
              >
                {/* Step box */}
                <div className="group relative">
                  <div
                    className="relative w-40 h-40 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 backdrop-blur-sm transition-all duration-300 hover:scale-110"
                    style={{
                      borderColor: step.color,
                      backgroundColor: `${step.color}10`,
                    }}
                  >
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                      style={{ backgroundColor: step.color }}
                    />

                    <div className="relative z-10 text-center">
                      <div className="text-5xl mb-2">{step.symbol}</div>
                      <div
                        className="font-['Syne'] font-bold text-lg"
                        style={{ color: step.color }}
                      >
                        {step.name}
                      </div>
                    </div>

                    {/* Pulse ring */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-20"
                      style={{
                        border: `2px solid ${step.color}`,
                        animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                        animationDelay: `${index * 0.3}s`,
                      }}
                    />
                  </div>
                </div>

                {/* Arrow connector (not on last item) */}
                {index < flow.length - 1 && (
                  <motion.div
                    className="hidden md:block"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  >
                    <ArrowRight
                      className="w-8 h-8"
                      style={{ color: step.color }}
                    />
                  </motion.div>
                )}

                {/* Vertical arrow for mobile */}
                {index < flow.length - 1 && (
                  <motion.div
                    className="md:hidden rotate-90"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  >
                    <ArrowRight
                      className="w-8 h-8"
                      style={{ color: step.color }}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech details */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="p-6 rounded-xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--wolf)]/20 flex items-center justify-center">
                <span className="text-xl">🦞</span>
              </div>
              <h3 className="font-['Syne'] font-bold text-xl text-[var(--foreground)]">
                OpenClaw Runtime
              </h3>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Each agent runs as an isolated OpenClaw instance with its own SOUL.md, skills, and wallet. The LLM reasons about the market every 30 seconds.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--grid-agent)]/20 flex items-center justify-center">
                <span className="text-xl">🌊</span>
              </div>
              <h3 className="font-['Syne'] font-bold text-xl text-[var(--foreground)]">
                Drift Protocol
              </h3>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Leveraged perpetual futures with on-chain order matching. When an agent decides to trade, the order goes straight to Drift — no middlemen.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--shark)]/20 flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <h3 className="font-['Syne'] font-bold text-xl text-[var(--foreground)]">
                LLM-Powered Decisions
              </h3>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Not scripts. Not backtests. Each agent uses a large language model to analyze price action, evaluate risk, and decide whether to trade.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--green)]/20 flex items-center justify-center">
                <span className="text-xl">◎</span>
              </div>
              <h3 className="font-['Syne'] font-bold text-xl text-[var(--foreground)]">
                Solana Settlement
              </h3>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Every trade settles on Solana. Sub-second finality, negligible fees, fully verifiable. Check the agents&apos; wallets yourself.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
