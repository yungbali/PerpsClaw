"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Copy, Mail, Sparkles, CheckCircle, TrendingUp, Zap } from "lucide-react";

export function CopyTradingTeaser() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Store in localStorage for now
    const existing = localStorage.getItem("copyTradingEmails");
    const emails = existing ? JSON.parse(existing) : [];
    emails.push({ email, timestamp: Date.now() });
    localStorage.setItem("copyTradingEmails", JSON.stringify(emails));

    setSubmitted(true);
    setEmail("");

    // Reset after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--shark)]/10 via-[var(--wolf)]/10 to-[var(--grid-agent)]/10 rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: "8s" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          className="relative p-12 rounded-3xl bg-gradient-to-br from-[var(--surface)]/90 to-[var(--surface-2)]/90 border border-[var(--border)] backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Shimmer effect */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden opacity-40">
            <div
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[var(--shark)] to-transparent"
              style={{ animation: "shimmer-line 4s ease-in-out infinite" }}
            />
          </div>

          {/* Coming Soon Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--wolf)]/20 border border-[var(--wolf)]/30 text-[var(--wolf)] font-semibold text-sm mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="font-['Syne'] font-bold text-4xl md:text-5xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-[var(--foreground)] via-[var(--shark)] to-[var(--wolf)] bg-clip-text text-transparent">
              Follow the Best-Performing Agent
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-[var(--muted)] mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Deposit SOL. Choose your agent. Mirror their trades automatically.
            <br />
            Earn proportional returns without managing positions yourself.
          </motion.p>

          {/* Features grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--shark)]/20 flex items-center justify-center flex-shrink-0">
                <Copy className="w-4 h-4 text-[var(--shark)]" />
              </div>
              <div>
                <div className="font-['Syne'] font-semibold text-[var(--foreground)] mb-1">
                  Auto-Mirror Trades
                </div>
                <div className="text-sm text-[var(--muted)]">
                  Every position automatically replicated
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--wolf)]/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-[var(--wolf)]" />
              </div>
              <div>
                <div className="font-['Syne'] font-semibold text-[var(--foreground)] mb-1">
                  Proportional Returns
                </div>
                <div className="text-sm text-[var(--muted)]">Agent profits = your profits</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--grid-agent)]/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-[var(--grid-agent)]" />
              </div>
              <div>
                <div className="font-['Syne'] font-semibold text-[var(--foreground)] mb-1">
                  Fully Non-Custodial
                </div>
                <div className="text-sm text-[var(--muted)]">Your keys, your funds, always</div>
              </div>
            </div>
          </motion.div>

          {/* Email capture form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {submitted ? (
              <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/30 text-[var(--green)]">
                <CheckCircle className="w-6 h-6" />
                <span className="font-['Syne'] font-semibold text-lg">
                  Thanks! We'll notify you when copy trading launches.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-2)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--shark)] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--shark)] to-[var(--wolf)] font-['Syne'] font-semibold text-white hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] transition-all duration-300 hover:scale-105 whitespace-nowrap"
                >
                  Get Early Access
                </button>
              </form>
            )}
          </motion.div>

          {/* Visual decoration */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-br from-[var(--shark)]/10 to-[var(--wolf)]/10 blur-3xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
