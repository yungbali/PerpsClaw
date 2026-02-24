"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Leaderboard } from "./Leaderboard";
import { AgentPositions } from "./AgentPositions";
import { TradeLog } from "./TradeLog";
import { ReasoningLog } from "./ReasoningLog";

const tabs = [
  { id: "reasoning", label: "Agent Thinking" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "positions", label: "Positions" },
  { id: "trades", label: "Trade Log" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("reasoning");

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden fade-up" style={{ animationDelay: "200ms" }}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-3 md:px-5 py-2 md:py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0",
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
        <div className="ml-auto pr-3 md:pr-4 flex items-center gap-2 flex-shrink-0">
          <div className="w-1 h-1 rounded-full bg-cyan breathe" />
          <span className="text-[9px] text-muted-2 uppercase tracking-wider hidden sm:inline">Real-time</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="h-[160px] md:h-[200px] overflow-hidden">
        {activeTab === "reasoning" && <ReasoningLog />}
        {activeTab === "leaderboard" && <Leaderboard />}
        {activeTab === "positions" && <AgentPositions />}
        {activeTab === "trades" && <TradeLog />}
      </div>
    </div>
  );
}
