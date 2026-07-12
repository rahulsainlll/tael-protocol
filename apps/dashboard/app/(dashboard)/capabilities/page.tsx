import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { Button } from "@tael/ui";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { CapabilitiesTable } from "../../../features/capabilities/capabilities-table";
import { toListItem } from "../../../features/capabilities/list-item";
import { listMyCapabilities } from "../../../features/capabilities/queries";

// Reads the database per request — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function CapabilitiesPage() {
  const capabilities = await listMyCapabilities();
  const items = capabilities.map(toListItem);

  return (
    <>
      <PageHeader
        title="My Capabilities"
        description="Publish and manage the capabilities you sell."
        action={
          <Button asChild>
            <Link href="/capabilities/new">
              <Plus /> Add capability
            </Link>
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No capabilities yet"
          description="Wrap an API, MCP server, or agent and publish it to start earning. Agents pay per call in USDC."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/capabilities/new">Add your first capability</Link>
            </Button>
          }
        />
      ) : (
        <CapabilitiesTable items={items} />
      )}
    </>
  );
}
