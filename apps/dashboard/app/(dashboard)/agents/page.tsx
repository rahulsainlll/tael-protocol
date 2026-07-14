import { Bot } from "lucide-react";
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
        title="My Agents"
        description="Create agents, fund them, and scope their spending."
        action={<CreateAgentDialog />}
      />
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create an agent wallet, set a spending policy, and let it purchase capabilities autonomously."
        />
      ) : (
        <AgentsList agents={agents} />
      )}
    </>
  );
}
