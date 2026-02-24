"use client";

import { AGENTS } from "@/config/agents";
import { AgentCard } from "./AgentCard";

export function AgentGrid() {
  return (
    <div className="flex flex-row md:flex-col gap-2 stagger-children overflow-x-auto md:overflow-x-visible scrollbar-none pb-2 md:pb-0">
      {AGENTS.map((agent, i) => (
        <div key={agent.id} className="min-w-[240px] md:min-w-0 flex-shrink-0 md:flex-shrink">
          <AgentCard agent={agent} rank={i} />
        </div>
      ))}
    </div>
  );
}
