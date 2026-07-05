import { Bot } from "lucide-react";
import { Button } from "@tael/ui";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";

export default function AgentsPage() {
  return (
    <>
      <PageHeader
        title="My Agents"
        description="Create agents, fund them, and scope their spending."
        action={<Button>New agent</Button>}
      />
      <EmptyState
        icon={Bot}
        title="No agents yet"
        description="Create an agent wallet, set a spending policy, and let it purchase capabilities autonomously."
      />
    </>
  );
}
