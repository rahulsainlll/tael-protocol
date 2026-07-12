import { PageHeader } from "../../../components/page-header";
import { listPublicCapabilities } from "../../../features/capabilities/queries";
import { MarketplaceGrid } from "../../../features/marketplace/marketplace-grid";
import { toMarketplaceItem } from "../../../features/marketplace/types";

// Reads the database per request — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const capabilities = await listPublicCapabilities();
  const items = capabilities.map(toMarketplaceItem);

  return (
    <>
      <PageHeader
        title="Marketplace"
        description="Discover capabilities agents can buy — APIs, MCP tools, agents, datasets, and more."
      />
      <MarketplaceGrid items={items} />
    </>
  );
}
