import { Boxes } from "lucide-react";
import { Button } from "@tael/ui";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";

export default function CapabilitiesPage() {
  return (
    <>
      <PageHeader
        title="My Capabilities"
        description="Publish and manage the capabilities you sell."
        action={<Button>Publish capability</Button>}
      />
      <EmptyState
        icon={Boxes}
        title="No capabilities yet"
        description="Wrap an API, MCP server, or agent with the Tael SDK and publish it to start earning."
        action={
          <Button variant="outline" size="sm">
            Read the SDK guide
          </Button>
        }
      />
    </>
  );
}
