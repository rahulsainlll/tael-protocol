import { KeyRound } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { listApiKeys } from "../../../features/api-keys/queries";
import { ApiKeyItem, CreateKeyButton } from "../../../features/api-keys/api-keys-manager";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const keys = await listApiKeys();

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Programmatic access to the Tael API for your agents and services."
        action={<CreateKeyButton />}
      />
      {keys.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API keys yet"
          description="Create a key to authenticate SDK and API requests from your own infrastructure."
        />
      ) : (
        <div className="divide-y rounded-xl border">
          {keys.map((row) => (
            <ApiKeyItem key={row.id} row={row} />
          ))}
        </div>
      )}
    </>
  );
}
