import { Building2 } from "lucide-react";
import { Button } from "@tael/ui";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";

export default function OrganizationsPage() {
  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage teams, members, and shared wallets."
        action={<Button>Create organization</Button>}
      />
      <EmptyState
        icon={Building2}
        title="No organizations yet"
        description="Create an organization to share wallets, capabilities, and billing across a team."
      />
    </>
  );
}
