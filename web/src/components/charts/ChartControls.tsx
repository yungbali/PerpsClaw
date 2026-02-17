"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const timeframes = ["1m", "5m", "15m", "1h", "4h", "1D"] as const;

export function ChartControls() {
  const [selected, setSelected] = useState<string>("15m");

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border z-10 relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5 bg-surface-2 rounded-md p-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelected(tf)}
              className={cn(
                "relative px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-200",
                selected === tf
                  ? "text-foreground bg-surface-3 shadow-sm"
                  : "text-muted-2 hover:text-muted"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-2">
        <span className="uppercase tracking-wider">Pyth Oracle</span>
        <div className="w-1 h-1 rounded-full bg-green breathe" />
      </div>
    </div>
  );
}
