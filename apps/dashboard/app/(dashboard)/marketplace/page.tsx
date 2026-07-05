import { PageHeader } from "../../../components/page-header";
import { MarketplaceGrid } from "../../../features/marketplace/marketplace-grid";

export default function MarketplacePage() {
  return (
    <>
      <PageHeader
        title="Marketplace"
        description="Discover capabilities agents can buy — APIs, MCP tools, agents, datasets, and more."
      />
      <MarketplaceGrid />
    </>
  );
}
