"use client";

import { AGENTS } from "@/config/agents";
import { AgentCard } from "./AgentCard";

export function AgentGrid() {
  return (
    <div className="flex flex-col gap-2 stagger-children">
      {AGENTS.map((agent, i) => (
        <AgentCard key={agent.id} agent={agent} rank={i} />
      ))}
    </div>
  );
}
