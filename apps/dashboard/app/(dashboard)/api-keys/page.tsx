import { KeyRound } from "lucide-react";
import { Button } from "@tael/ui";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader
        title="API Keys"
        description="Programmatic access to the Tael API for your agents and services."
        action={<Button>Create key</Button>}
      />
      <EmptyState
        icon={KeyRound}
        title="No API keys yet"
        description="Create a key to authenticate SDK and API requests from your own infrastructure."
      />
    </>
  );
}
