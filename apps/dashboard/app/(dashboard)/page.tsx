import { Activity, ArrowLeftRight, Bot, TrendingUp, Wallet } from "lucide-react";
import { EmptyState } from "../../components/empty-state";
import { PageHeader } from "../../components/page-header";
import { StatCard } from "../../components/stat-card";

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Your wallets, spend, and revenue at a glance." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Wallet balance" value="$20.00" hint="USDC" icon={Wallet} />
        <StatCard
          label="Spend (30d)"
          value="$0.71"
          hint="Across 4 capabilities"
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Revenue (30d)"
          value="$0.00"
          hint="Publish to start earning"
          icon={TrendingUp}
        />
        <StatCard label="Active agents" value="0" hint="Create your first agent" icon={Bot} />
      </section>
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Payments and settlements appear here once your agents start transacting."
      />
    </>
  );
}
