"use client";

import dynamic from "next/dynamic";
import { ChartControls } from "./ChartControls";
import { usePriceStore } from "@/stores/usePriceStore";

const ChartCanvas = dynamic(() => import("./ChartCanvas"), { ssr: false });

const EMPTY_CANDLES: never[] = [];

export function TradingChart() {
  const candles = usePriceStore((s) => s.candles) ?? EMPTY_CANDLES;

  return (
    <div className="relative flex flex-col h-full rounded-lg overflow-hidden border border-border bg-surface">
      {/* Ambient glow */}
      <div className="arena-glow" />

      {/* Chart header */}
      <ChartControls />

      {/* Chart body */}
      <div className="flex-1 relative min-h-0 z-10">
        <ChartCanvas candles={candles} />
        {candles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-8 h-8 border-2 border-border-2 border-t-cyan rounded-full animate-spin" />
            <span className="text-xs text-muted-2">Connecting to Pyth oracle...</span>
          </div>
        )}
      </div>

      {/* Bottom edge gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none z-20" />
    </div>
  );
}
