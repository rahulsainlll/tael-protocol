import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAgentDetail } from "../../../../features/agents/queries";
import { CardVisual } from "../../../../features/agents/card-visual";
import { AgentManage } from "../../../../features/agents/agent-manage";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentDetail(id);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Cards
      </Link>

      <div className="grid items-center gap-6 md:grid-cols-2">
        <CardVisual
          name={agent.name}
          address={agent.address}
          usdc={agent.usdc}
          policy={agent.policy}
          ready={agent.ready}
          className="w-full max-w-sm"
        />
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Card</p>
            <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          </div>
          {agent.ready ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready to spend
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Needs provisioning
            </span>
          )}
          <p className="text-sm text-muted-foreground">
            Fund this card and set its limits below. Your agents pay from it per call, and nothing
            exceeds the caps you set.
          </p>
        </div>
      </div>

      <AgentManage agent={agent} />
    </div>
  );
}
