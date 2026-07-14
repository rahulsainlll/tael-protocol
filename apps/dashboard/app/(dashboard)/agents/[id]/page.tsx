import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot } from "lucide-react";
import { getAgentDetail } from "../../../../features/agents/queries";
import { AgentManage } from "../../../../features/agents/agent-manage";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentDetail(id);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My Agents
      </Link>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Bot className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            Balance: ${Number(agent.usdc).toFixed(2)} USDC
            {agent.policy ? (
              <>
                {" · "}max ${agent.policy.maxPerCall}/call{" · "}${agent.policy.dailyLimit}/day
              </>
            ) : null}
          </p>
        </div>
        {agent.ready ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
            Ready
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
            Not ready
          </span>
        )}
      </div>

      <AgentManage agent={agent} />
    </div>
  );
}
