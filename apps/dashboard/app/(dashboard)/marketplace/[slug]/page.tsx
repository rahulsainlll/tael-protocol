import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChevronDown, Code2 } from "lucide-react";
import { Button, cn } from "@tael/ui";
import { getPublicCapabilityBySlug } from "../../../../features/capabilities/queries";
import { formatPrice, kindMeta, timeAgo } from "../../../../features/capabilities/kind-meta";
import { VerificationTimeline } from "../../../../features/capabilities/verification-timeline";

export const dynamic = "force-dynamic";

export default async function CapabilityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const capability = await getPublicCapabilityBySlug(slug);
  if (!capability) notFound();

  const verified = capability.status === "verified";
  const meta = kindMeta(capability.kind);
  const Icon = meta.icon;
  const operations = capability.spec.operations ?? [];

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
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
            meta.tile,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">Capability</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {capability.name}
            {verified ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : null}
          </h1>
        </div>
        <Button>Use capability</Button>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-6 border-y py-5 sm:grid-cols-4">
        <Meta label="Status">
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-700">
              <BadgeCheck className="h-4 w-4" /> Verified
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-sm text-muted-foreground">
              Draft
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

      {/* Verification journey */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Verification
        </h2>
        <VerificationTimeline verified={verified} />
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

      {/* Requests — each operation with its price + sample request/response */}
      {operations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <Code2 className="h-4 w-4" /> Requests
          </h2>
          <div className="space-y-4">
            {operations.map((op, i) => (
              <div key={i} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {op.method ? (
                    <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-blue-600">
                      {op.method}
                    </span>
                  ) : null}
                  <span className="font-medium">{op.name || `Request ${i + 1}`}</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    /{capability.slug}
                  </code>
                  <span className="ml-auto text-sm font-semibold">
                    ${formatPrice(op.price)}
                    <span className="text-xs font-normal text-muted-foreground">USDC/call</span>
                  </span>
                </div>
                {op.sampleRequest || op.sampleResponse ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {op.sampleRequest ? (
                      <CodeBlock title="Sample request" code={op.sampleRequest} />
                    ) : null}
                    {op.sampleResponse ? (
                      <CodeBlock title="Sample response" code={op.sampleResponse} />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
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
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
        {title}
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
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
