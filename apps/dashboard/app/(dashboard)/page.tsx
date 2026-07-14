import Link from "next/link";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bot, Boxes } from "lucide-react";
import { PageHeader } from "../../components/page-header";
import { StatCard } from "../../components/stat-card";
import { getPaymentsData } from "../../features/payments/queries";
import { getOverviewCounts } from "../../features/overview/queries";

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

export default async function OverviewPage() {
  const [{ earned, spent, activity }, counts] = await Promise.all([
    getPaymentsData(),
    getOverviewCounts(),
  ]);

  return (
    <>
      <PageHeader title="Overview" description="Your earnings, spend, and activity at a glance." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Earned"
          value={`$${usd(earned)}`}
          hint="USDC, all-time"
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Spent"
          value={`$${usd(spent)}`}
          hint="By your agents"
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Agents"
          value={String(counts.agents)}
          hint={counts.agents === 0 ? "Create your first agent" : "Funded, capped wallets"}
          icon={Bot}
        />
        <StatCard
          label="Capabilities"
          value={String(counts.capabilities)}
          hint={counts.capabilities === 0 ? "Publish to start earning" : "Published by you"}
          icon={Boxes}
        />
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
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
            <Activity className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Payments appear here once your agents start transacting or someone uses your
              capabilities.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border">
            {activity.slice(0, 6).map((row) => {
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
