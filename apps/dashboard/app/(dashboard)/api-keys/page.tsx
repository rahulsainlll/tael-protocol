import { KeyRound } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { listApiKeys } from "../../../features/api-keys/queries";
import { listCardsForPicker } from "../../../features/agents/queries";
import { ApiKeysTable, CreateKeyButton } from "../../../features/api-keys/api-keys-manager";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const [keys, cards] = await Promise.all([listApiKeys(), listCardsForPicker()]);

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Keys authenticate your app or agent to the Tael API. Each key spends from a Card, within that Card's limits."
        action={<CreateKeyButton cards={cards} />}
      />
      {keys.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API keys yet"
          description="Create a key, link it to a Card, and use it to call any capability from your own code."
        />
      ) : (
        <ApiKeysTable rows={keys} />
      )}
    </>
  );
}
