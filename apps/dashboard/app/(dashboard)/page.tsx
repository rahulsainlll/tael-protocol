import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Boxes, CreditCard, Store, Wallet } from "lucide-react";
import { PageHeader } from "../../components/page-header";
import { getPaymentsData } from "../../features/payments/queries";
import { getOverviewCounts } from "../../features/overview/queries";
import { QuickAction, type QuickActionProps } from "../../features/overview/quick-action";
import { GettingStarted, type SetupStep } from "../../features/overview/getting-started";

export const dynamic = "force-dynamic";

function usd(v: string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function truncate(addr: string): string {
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  for (const [sec, label] of [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ] as const) {
    if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  }
  return "just now";
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function OverviewPage() {
  const [{ spent, activity }, counts] = await Promise.all([getPaymentsData(), getOverviewCounts()]);

  const hasAgents = counts.agents > 0;
  const hasCapabilities = counts.capabilities > 0;
  const hasSpent = Number(spent) > 0;

  // Real progress through the core loop. Step 1 is done the moment you're here.
  const steps: SetupStep[] = [
    {
      label: "Connect your wallet",
      hint: "Your Stellar wallet is your identity.",
      done: true,
      href: "/wallet",
      cta: "Open",
    },
    {
      label: "Create a card",
      hint: "A funded hot wallet your agents pay from, within limits you set.",
      done: hasAgents,
      href: "/agents",
      cta: "Create card",
    },
    {
      label: "Run your first capability",
      hint: "Pay for an API from a card and settle it on-chain.",
      done: hasSpent,
      href: "/marketplace",
      cta: "Browse",
    },
    {
      label: "Publish a capability to earn",
      hint: "Put an API behind a paywall and get paid per call.",
      done: hasCapabilities,
      href: "/capabilities",
      cta: "Publish",
    },
  ];
  const setupComplete = steps.every((s) => s.done);

  const actions: QuickActionProps[] = [
    {
      href: "/marketplace",
      icon: Store,
      title: "Browse marketplace",
      subtitle: "Find a capability to use",
    },
    {
      href: "/agents",
      icon: CreditCard,
      title: "Cards",
      subtitle: hasAgents
        ? `Manage ${plural(counts.agents, "card", "cards")}`
        : "Create a funded card",
    },
    {
      href: "/capabilities",
      icon: Boxes,
      title: "My Capabilities",
      subtitle: hasCapabilities
        ? `Manage ${plural(counts.capabilities, "capability", "capabilities")}`
        : "Publish an API to earn",
    },
    {
      href: "/wallet",
      icon: Wallet,
      title: "Wallet",
      subtitle: "Fund cards and set limits",
    },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Everything you can do with Tael, in one place." />

      {setupComplete ? null : <GettingStarted steps={steps} />}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((a) => (
            <QuickAction key={a.href} {...a} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          {activity.length > 0 ? (
            <Link href="/payments" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          ) : null}
        </div>

        {activity.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No payments yet. Once your agents transact or someone uses your capabilities, it shows
            up here.
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {activity.slice(0, 3).map((row) => {
              const inbound = row.direction === "earned";
              return (
                <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      inbound ? "bg-emerald-500/10" : "bg-muted"
                    }`}
                  >
                    {inbound ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.capability}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {inbound ? "from" : "to"} {truncate(row.counterparty)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        inbound ? "text-emerald-600" : "text-foreground"
                      }`}
                    >
                      {inbound ? "+" : "−"}${usd(row.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(row.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
