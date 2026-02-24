"use client";

import { TopBar } from "@/components/arena/TopBar";
import { AgentGrid } from "@/components/arena/AgentGrid";
import { TradingChart } from "@/components/charts/TradingChart";
import { BottomPanel } from "@/components/arena/BottomPanel";

export default function ArenaPage() {
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-shark/[0.03] rounded-full blur-[100px]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-wolf/[0.03] rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-grid/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <TopBar />

        {/* Main arena */}
        <div className="flex-1 flex gap-2 p-2 min-h-0">
          {/* Left sidebar: Agent cards */}
          <aside className="w-[280px] flex-shrink-0 overflow-y-auto scrollbar-none">
            <AgentGrid />
          </aside>

          {/* Center: Chart + Bottom panel */}
          <main className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex-1 min-h-0">
              <TradingChart />
            </div>
            <BottomPanel />
          </main>
        </div>
      </div>
    </div>
  );
}
