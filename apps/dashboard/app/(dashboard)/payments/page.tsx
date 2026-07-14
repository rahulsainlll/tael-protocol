import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { EmptyState } from "../../../components/empty-state";
import { getPaymentsData, type ActivityRow } from "../../../features/payments/queries";

export const dynamic = "force-dynamic";

function money(v: string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

function truncate(addr: string): string {
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [number, string][] = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [sec, label] of units) {
    if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  }
  return "just now";
}

export default async function PaymentsPage() {
  const { earned, spent, activity } = await getPaymentsData();

  return (
    <>
      <PageHeader title="Payments" description="Your earnings and spending across Tael." />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Earned"
          value={earned}
          hint="From capabilities you publish"
          icon={<ArrowDownLeft className="h-4 w-4 text-emerald-600" />}
          accent="text-emerald-600"
        />
        <StatCard
          label="Spent"
          value={spent}
          hint="By your agents"
          icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Activity */}
      {activity.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Once an agent pays for one of your capabilities, or one of your agents pays for a call, it shows up here."
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          <div className="divide-y rounded-xl border">
            {activity.map((row) => (
              <ActivityItem key={row.id} row={row} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${accent ?? ""}`}>
        ${money(value)} <span className="text-sm font-normal text-muted-foreground">USDC</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  const earned = row.direction === "earned";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          earned ? "bg-emerald-500/10" : "bg-muted"
        }`}
      >
        {earned ? (
          <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.capability}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {earned ? "from" : "to"} {truncate(row.counterparty)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold tabular-nums ${
            earned ? "text-emerald-600" : "text-foreground"
          }`}
        >
          {earned ? "+" : "−"}${money(row.amount)}
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo(row.createdAt)}</p>
      </div>
    </div>
  );
}
