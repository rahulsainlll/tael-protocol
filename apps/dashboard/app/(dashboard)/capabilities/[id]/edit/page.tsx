import { notFound } from "next/navigation";
import { PageHeader } from "../../../../../components/page-header";
import { getEditableCapability } from "../../../../../features/capabilities/queries";
import {
  EditCapabilityForm,
  type EditCapabilityData,
  type EditOperation,
} from "../../../../../features/capabilities/edit-capability-form";

export const dynamic = "force-dynamic";

/** Turn a stored UpstreamAuth's static headers back into "Name: value" lines. */
function headersToLines(extra: Record<string, string> | undefined): string {
  if (!extra) return "";
  return Object.entries(extra)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export default async function EditCapabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const capability = await getEditableCapability(id);
  if (!capability) notFound();

  const auth = capability.upstreamAuth;
  const operations: EditOperation[] = (capability.spec.operations ?? []).map((op) => ({
    name: op.name ?? "",
    method: op.method ?? "POST",
    path: op.path ?? "",
    price: op.price ?? "",
    sampleRequest: op.sampleRequest ?? "",
    sampleResponse: op.sampleResponse ?? "",
  }));

  const data: EditCapabilityData = {
    id: capability.id,
    name: capability.name,
    kind: capability.kind,
    description: capability.description,
    logoUrl: capability.logoUrl ?? "",
    contact: capability.contact ?? "",
    visibility: capability.visibility,
    payTo: capability.payTo,
    upstreamUrl: capability.upstreamUrl,
    authScheme: auth?.scheme ?? "bearer",
    authHeader: auth?.header ?? "",
    authExtraHeaders: headersToLines(auth?.extraHeaders),
    hasSecret: capability.upstreamSecretEnc !== null,
    operations,
  };

  return (
    <>
      <PageHeader
        title="Edit capability"
        description="Update your listing, payout, connection, and priced requests."
      />
      <EditCapabilityForm data={data} />
    </>
  );
}
