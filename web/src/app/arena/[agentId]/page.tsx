"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { AGENTS } from "@/config/agents";
import { usePrices } from "@/hooks/usePrices";
import { useAgentPositions } from "@/hooks/useAgentPositions";
import { AgentDetailView } from "@/components/arena/AgentDetailView";

interface Props {
  params: Promise<{ agentId: string }>;
}

export default function AgentDetailPage({ params }: Props) {
  const { agentId } = use(params);
  const agent = AGENTS.find((a) => a.id === agentId);

  usePrices();
  useAgentPositions();

  if (!agent) return notFound();

  return <AgentDetailView agent={agent} />;
}
