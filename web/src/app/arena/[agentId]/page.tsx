"use client";

import { notFound } from "next/navigation";
import { AGENTS } from "@/config/agents";
import { AgentDetailView } from "@/components/arena/AgentDetailView";

interface Props {
  params: { agentId: string };
}

export default function AgentDetailPage({ params }: Props) {
  const agent = AGENTS.find((a) => a.id === params.agentId);
  if (!agent) return notFound();

  return <AgentDetailView agent={agent} />;
}
