import { AlertTriangle, BarChart3, Gauge, PhoneCall, TrendingUp } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { StatCard } from "../../../components/stat-card";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Usage, performance, and revenue for your capabilities."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Calls (30d)" value="0" icon={PhoneCall} />
        <StatCard label="Success rate" value="—" icon={Gauge} />
        <StatCard label="Avg latency" value="—" icon={TrendingUp} />
        <StatCard label="Errors" value="0" icon={AlertTriangle} />
      </section>
      <EmptyState
        icon={BarChart3}
        title="No data to chart yet"
        description="Revenue and call-volume charts render here once your capabilities receive traffic."
      />
    </>
  );
}
