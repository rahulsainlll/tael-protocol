import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@tael/ui";
import { getPublicCapabilityBySlug } from "../../../../features/capabilities/queries";
import { isCurrentUserAdmin } from "../../../../features/capabilities/actions";
import { CapabilityLogo } from "../../../../features/capabilities/capability-logo";
import { formatPrice, kindMeta, timeAgo } from "../../../../features/capabilities/kind-meta";
import { UseCapabilityDialog } from "../../../../features/capabilities/use-capability-dialog";
import { VerifyToggle } from "../../../../features/capabilities/verify-toggle";
import { OperationsExplorer } from "../../../../features/agents/operations-explorer";
import { listAgentsForRun } from "../../../../features/agents/queries";
import { ReviewsSection } from "../../../../features/reviews/reviews-section";
import { VerificationTimeline } from "../../../../features/capabilities/verification-timeline";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const dynamic = "force-dynamic";

/** URL-safe operation handle for `/c/<slug>/<op>` (mirrors the publish action). */
function opSlug(name: string | undefined, i: number): string {
  const base = (name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `op-${i + 1}`;
}

export default async function CapabilityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const capability = await getPublicCapabilityBySlug(slug);
  if (!capability) notFound();

  const agentOptions = await listAgentsForRun();
  const verified = capability.status === "verified";
  const isAdmin = await isCurrentUserAdmin();
  const meta = kindMeta(capability.kind);
  const Icon = meta.icon;
  const operations = capability.spec.operations ?? [];
  const contact = capability.contact;
  const contactHref = contact
    ? contact.startsWith("http")
      ? contact
      : /\S+@\S+\.\S+/.test(contact)
        ? `mailto:${contact}`
        : null
    : null;

  return (
    <div className="space-y-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Marketplace
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <CapabilityLogo
          src={capability.logoUrl}
          name={capability.name}
          kind={capability.kind}
          className="h-14 w-14 rounded-xl"
          iconClassName="h-6 w-6"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">Capability</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {capability.name}
            {verified ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : null}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <VerifyToggle id={capability.id} verified={verified} variant="compact" />
          ) : null}
          <UseCapabilityDialog
            endpoint={`${API_URL}/c/${capability.slug}`}
            price={`$${formatPrice(capability.price)}`}
          />
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-6 border-y py-5 sm:grid-cols-4">
        <Meta label="Status">
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-700">
              <BadgeCheck className="h-4 w-4" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending review
            </span>
          )}
        </Meta>
        <Meta label="Kind">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-sm font-medium",
              meta.badge,
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {meta.label}
          </span>
        </Meta>
        <Meta label="Price">
          <span className="font-medium">
            {operations.length > 1 ? "from " : ""}${formatPrice(capability.price)} USDC/call
          </span>
        </Meta>
        <Meta label="Published">
          <span className="font-medium">{timeAgo(capability.createdAt.toISOString())}</span>
        </Meta>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Admin — set this capability&apos;s status from the header.
          </span>
          <Link
            href={`/capabilities/${capability.id}/edit`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </div>
      ) : null}

      {contact ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Support</span>{" "}
          {contactHref ? (
            <a
              href={contactHref}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {contact}
            </a>
          ) : (
            <span>{contact}</span>
          )}
        </p>
      ) : null}

      {/* Verification journey */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Verification
        </h2>
        <VerificationTimeline
          status={capability.status}
          publishedLabel={timeAgo(capability.createdAt.toISOString())}
        />
      </section>

      {/* Description */}
      {capability.description ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            About
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">{capability.description}</p>
        </section>
      ) : null}

      {/* Operations — expandable table: edit params, run inline, see the result. */}
      {operations.length > 0 ? (
        <OperationsExplorer
          slug={capability.slug}
          agents={agentOptions}
          operations={operations.map((op, i) => ({
            name: op.name || `Request ${i + 1}`,
            opSlug: op.slug || opSlug(op.name, i),
            method: op.method || "GET",
            price: formatPrice(op.price),
            priceRaw: op.price ?? "0",
            sampleRequest: op.sampleRequest ?? "",
            sampleResponse: op.sampleResponse ?? "",
          }))}
        />
      ) : null}

      {/* FAQ — visible to buyers, collapsed by default */}
      {capability.faqs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">FAQ</h2>
          <div className="divide-y rounded-xl border">
            {capability.faqs.map((faq, i) => (
              <details key={i} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      <ReviewsSection capabilityId={capability.id} slug={capability.slug} />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
