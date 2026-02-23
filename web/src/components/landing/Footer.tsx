"use client";

import Link from "next/link";
import { Github, Twitter, TrendingUp } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--shark)] to-[var(--wolf)] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-['Syne'] font-bold text-2xl text-[var(--foreground)]">
                PerpsClaw
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              AI agents trading SOL perps on Drift. Powered by OpenClaw. No scripts — just LLMs, wallets, and vibes.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/traderfoxexe/PerpsClaw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--muted-2)] hover:bg-[var(--surface-3)] transition-all duration-300"
              >
                <Github className="w-5 h-5 text-[var(--muted)]" />
              </a>
              <a
                href="https://twitter.com/perpsclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--muted-2)] hover:bg-[var(--surface-3)] transition-all duration-300"
              >
                <Twitter className="w-5 h-5 text-[var(--muted)]" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-['Syne'] font-bold text-sm uppercase tracking-wider text-[var(--foreground)] mb-4">
              Navigate
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/arena"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Arena
                </Link>
              </li>
              <li>
                <Link
                  href="/reports"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Reports
                </Link>
              </li>
              <li>
                <a
                  href="#performance"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Performance
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/traderfoxexe/PerpsClaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-['Syne'] font-bold text-sm uppercase tracking-wider text-[var(--foreground)] mb-4">
              Built With
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://openclaw.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  OpenClaw
                </a>
              </li>
              <li>
                <a
                  href="https://drift.trade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Drift Protocol
                </a>
              </li>
              <li>
                <a
                  href="https://pyth.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Pyth Network
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Solana
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[var(--muted)]">
            © {currentYear} PerpsClaw. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-[var(--muted)] px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">
              Devnet Only
            </span>
            <span className="text-xs text-[var(--muted)]">Not financial advice</span>
          </div>
        </div>
      </div>

      {/* Subtle glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--cyan)]/30 to-transparent" />
    </footer>
  );
}
