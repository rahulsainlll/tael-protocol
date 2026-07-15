import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { EmptyState } from "../../../components/empty-state";
import { getPaymentsData } from "../../../features/payments/queries";
import { ActivityFeed } from "../../../features/payments/activity-feed";

export const dynamic = "force-dynamic";

function money(v: string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
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
          <ActivityFeed rows={activity} />
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
