"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Leaderboard } from "./Leaderboard";
import { AgentPositions } from "./AgentPositions";
import { TradeLog } from "./TradeLog";

const tabs = [
  { id: "leaderboard", label: "Leaderboard" },
  { id: "positions", label: "Positions" },
  { id: "trades", label: "Trade Log" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("leaderboard");

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden fade-up" style={{ animationDelay: "200ms" }}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-2 hover:text-muted"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-px bg-cyan tab-active-line" />
            )}
          </button>
        ))}

        {/* Right side: live counter */}
        <div className="ml-auto pr-4 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-cyan breathe" />
          <span className="text-[9px] text-muted-2 uppercase tracking-wider">Real-time</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="h-[200px] overflow-hidden">
        {activeTab === "leaderboard" && <Leaderboard />}
        {activeTab === "positions" && <AgentPositions />}
        {activeTab === "trades" && <TradeLog />}
      </div>
    </div>
  );
}
