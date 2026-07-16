import { ArrowDownLeft, ArrowLeftRight, PhoneCall, Receipt } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { StatCard } from "../../../components/stat-card";
import { getAnalytics } from "../../../features/analytics/queries";
import { BarChart } from "../../../features/analytics/bar-chart";

export const dynamic = "force-dynamic";

function usd(v: string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  const hasData = a.series.some((p) => p.earned || p.spent || p.calls);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Your earnings, spend, and call volume (last 30 days)."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Earned (30d)" value={`$${usd(a.totalEarned)}`} icon={ArrowDownLeft} />
        <StatCard label="Spent (30d)" value={`$${usd(a.totalSpent)}`} icon={ArrowLeftRight} />
        <StatCard
          label="Calls (30d)"
          value={String(a.totalCalls + a.earnedCalls)}
          icon={PhoneCall}
        />
      </section>

      {!hasData ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No data to chart yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Charts fill in once your capabilities receive traffic or your agents make calls.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Earnings" subtitle="USDC received per day">
            <BarChart data={a.series} metric="earned" color="#059669" />
          </ChartCard>
          <ChartCard title="Spend" subtitle="USDC paid by your cards">
            <BarChart data={a.series} metric="spent" color="#6b7280" />
          </ChartCard>
          <ChartCard title="Call volume" subtitle="Paid calls per day" className="lg:col-span-2">
            <BarChart data={a.series} metric="calls" color="#156DFC" />
          </ChartCard>
        </div>
      )}
    </>
  );
}

function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
