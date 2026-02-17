"use client";

import { cn } from "@/lib/utils";
import { usePriceStore } from "@/stores/usePriceStore";

export function TopBar() {
  const price = usePriceStore((s) => s.price);

  return (
    <header className="relative flex items-center justify-between px-5 py-3 bg-surface/80 backdrop-blur-sm border-b border-border z-50">
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {/* Claw icon */}
          <div className="relative w-7 h-7 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-cyan">
              <path d="M4 3L8 14M10 3L11 14M16 3L12 14M20 3L14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M6 18C6 18 9 21 12 21C15 21 18 18 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 bg-cyan/10 rounded-full blur-md" />
          </div>
          <h1 className="font-display text-base font-800 tracking-tight text-foreground">
            PERPS<span className="text-cyan">CLAW</span>
          </h1>
        </div>

        <div className="w-px h-4 bg-border-2" />

        <div className="flex items-center gap-2">
          <span className="text-2xs font-medium text-muted uppercase tracking-wider">SOL-PERP</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan font-medium tracking-wide">DRIFT</span>
        </div>
      </div>

      {/* Center: Price */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        {price ? (
          <>
            <span className="font-display text-xl font-700 text-foreground tabular-nums tracking-tight">
              ${price.price.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-xs font-medium tabular-nums px-2 py-0.5 rounded-full",
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
          <div className="h-7 w-32 bg-surface-3 rounded animate-pulse" />
        )}
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 text-2xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-2 uppercase tracking-wider">Agents</span>
            <span className="text-foreground font-semibold">3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-2 uppercase tracking-wider">Market</span>
            <span className="text-foreground font-semibold">SOL</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-border-2">
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 rounded-full bg-green breathe" />
            <div className="pulse-ring text-green" />
          </div>
          <span className="text-2xs font-medium text-green/80 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Bottom edge gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />
    </header>
  );
}
