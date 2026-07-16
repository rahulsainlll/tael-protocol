import { CreditCard } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { listAgentWallets } from "../../../features/agents/queries";
import { AgentsList } from "../../../features/agents/agents-list";
import { CreateAgentDialog } from "../../../features/agents/create-agent-dialog";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await listAgentWallets();

  return (
    <>
      <PageHeader
        title="Cards"
        description="Funded, capped spending cards your agents pay from. Fund one and set its limits."
        action={<CreateAgentDialog />}
      />
      {agents.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No cards yet"
          description="Create a card, fund it with USDC, and set spending limits. Your agents pay per call within them."
        />
      ) : (
        <AgentsList agents={agents} />
      )}
    </>
  );
}
