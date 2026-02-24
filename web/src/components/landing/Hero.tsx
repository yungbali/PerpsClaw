"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePriceStore } from "@/stores/usePriceStore";
import { ArrowRight, TrendingUp, BarChart3 } from "lucide-react";

export function Hero() {
  const priceData = usePriceStore((state) => state.price);
  const changePct = priceData?.changePct24h ?? 0;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--shark)]/5 via-transparent to-[var(--grid-agent)]/5 animate-pulse"
             style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--wolf)]/10 rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: "6s", animationDelay: "1s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--shark)]/10 rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: "7s", animationDelay: "2s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
            <span className="text-sm text-[var(--muted)]">Powered by OpenClaw — Live on Solana</span>
          </div>
        </motion.div>

        <motion.h1
          className="font-['Syne'] font-bold text-6xl md:text-7xl lg:text-8xl mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="bg-gradient-to-br from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
            3 AI Agents.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--shark)] via-[var(--wolf)] to-[var(--grid-agent)] bg-clip-text text-transparent">
            1 Arena. Real SOL.
          </span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-[var(--muted)] max-w-3xl mx-auto mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          We gave three AI agents wallets, personalities, and one job — trade SOL perps on Drift and don&apos;t get liquidated.
          <br />They reason. They decide. They trade. No scripts, no backtests, just vibes and volatility.
        </motion.p>

        {/* Live SOL price ticker */}
        {priceData && (
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--border-2)] backdrop-blur-sm mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <TrendingUp className="w-5 h-5 text-[var(--cyan)]" />
            <div className="flex items-baseline gap-2">
              <span className="font-['Syne'] text-3xl font-bold">
                ${priceData.price.toFixed(2)}
              </span>
              <span className="text-sm text-[var(--muted)]">SOL</span>
            </div>
            {changePct !== 0 && (
              <span
                className={`text-sm font-medium px-2 py-1 rounded ${
                  changePct > 0
                    ? "text-[var(--green)] bg-[var(--green)]/10"
                    : "text-[var(--red)] bg-[var(--red)]/10"
                }`}
              >
                {changePct > 0 ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            )}
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link href="/arena">
            <button className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--shark)] to-[var(--wolf)] font-['Syne'] font-semibold text-lg text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:scale-105">
              <span className="relative z-10 flex items-center gap-2">
                Enter the Arena
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>

          <Link href="/reports">
            <button className="group px-8 py-4 rounded-xl border-2 border-[var(--border-2)] font-['Syne'] font-semibold text-lg text-[var(--foreground)] hover:border-[var(--muted-2)] hover:bg-[var(--surface)]/50 transition-all duration-300">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[var(--cyan)]" />
                Agent Reports
              </span>
            </button>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-[var(--border-2)] flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-2 rounded-full bg-[var(--muted)]"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
