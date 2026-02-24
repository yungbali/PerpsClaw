"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePriceStore } from "@/stores/usePriceStore";
import { useAgentStore, selectTotalPnl, selectActiveCount } from "@/stores/useAgentStore";

interface TopBarProps {
  onToggleAgents?: () => void;
  showAgents?: boolean;
}

export function TopBar({ onToggleAgents, showAgents }: TopBarProps) {
  const price = usePriceStore((s) => s.price);
  const totalPnl = useAgentStore(selectTotalPnl);
  const activeCount = useAgentStore(selectActiveCount);

  return (
    <header className="relative flex items-center justify-between px-3 md:px-5 py-2.5 md:py-3 bg-surface/80 backdrop-blur-sm border-b border-border z-50">
      {/* Left: Brand + mobile toggle */}
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative w-6 h-6 md:w-7 md:h-7 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-cyan md:w-5 md:h-5">
              <path d="M4 3L8 14M10 3L11 14M16 3L12 14M20 3L14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M6 18C6 18 9 21 12 21C15 21 18 18 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 bg-cyan/10 rounded-full blur-md" />
          </div>
          <h1 className="font-display text-sm md:text-base font-800 tracking-tight text-foreground">
            PERPS<span className="text-cyan">CLAW</span>
          </h1>
        </Link>

        {/* Mobile agents toggle */}
        {onToggleAgents && (
          <button
            onClick={onToggleAgents}
            className={cn(
              "md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-colors border",
              showAgents
                ? "bg-cyan/10 text-cyan border-cyan/30"
                : "text-muted border-border hover:text-foreground"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v-2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            Agents
          </button>
        )}

        <div className="hidden md:block w-px h-4 bg-border-2" />

        <div className="hidden md:flex items-center gap-2">
          <span className="text-2xs font-medium text-muted uppercase tracking-wider">SOL-PERP</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan font-medium tracking-wide">DRIFT</span>
        </div>
      </div>

      {/* Center: Price -- visible on all sizes but positioned differently */}
      <div className="flex items-center gap-2 md:gap-3 md:absolute md:left-1/2 md:-translate-x-1/2">
        {price ? (
          <>
            <span className="font-display text-base md:text-xl font-700 text-foreground tabular-nums tracking-tight">
              ${price.price.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-[10px] md:text-xs font-medium tabular-nums px-1.5 md:px-2 py-0.5 rounded-full",
                price.changePct24h > 0
                  ? "text-green bg-green/8"
                  : price.changePct24h < 0
                    ? "text-red bg-red/8"
                    : "text-muted bg-surface-3"
              )}
            >
              {price.changePct24h >= 0 ? "+" : ""}
              {price.changePct24h.toFixed(2)}%
            </span>
          </>
        ) : (
          <div className="h-6 w-24 md:h-7 md:w-32 bg-surface-3 rounded animate-pulse" />
        )}
      </div>

      {/* Right: Status -- compact on mobile */}
      <div className="flex items-center gap-2 md:gap-5">
        {/* Total PnL -- hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-surface-2/50">
          <span className="text-2xs text-muted-2 uppercase tracking-wider hidden md:inline">Total PnL</span>
          <span
            className={cn(
              "font-display text-xs md:text-sm font-700 tabular-nums",
              totalPnl > 0 ? "text-green" : totalPnl < 0 ? "text-red" : "text-muted"
            )}
          >
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </span>
        </div>

        <div className="hidden md:block w-px h-4 bg-border-2" />

        <div className="hidden lg:flex items-center gap-4 text-2xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-2 uppercase tracking-wider">Active</span>
            <span className="text-foreground font-semibold">{activeCount}/3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-2 uppercase tracking-wider">Market</span>
            <span className="text-foreground font-semibold">SOL</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 md:pl-4 md:border-l md:border-border-2">
          <div className="relative w-2 h-2">
            <div className={cn("absolute inset-0 rounded-full", activeCount > 0 ? "bg-green breathe" : "bg-muted")} />
            {activeCount > 0 && <div className="pulse-ring text-green" />}
          </div>
          <span className={cn("text-2xs font-medium uppercase tracking-widest", activeCount > 0 ? "text-green/80" : "text-muted")}>
            {activeCount > 0 ? "Live" : "Idle"}
          </span>
        </div>
      </div>

      {/* Bottom edge gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />
    </header>
  );
}
