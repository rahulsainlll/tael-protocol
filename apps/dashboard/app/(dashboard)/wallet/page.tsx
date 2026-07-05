import { Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { BalanceCard } from "../../../features/wallet/balance-card";

export default function WalletPage() {
  return (
    <>
      <PageHeader title="Wallet" description="Fund your agents and manage spending policies." />
      <div className="grid gap-4 lg:grid-cols-2">
        <BalanceCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending policy</CardTitle>
            <CardDescription>On-chain limits scope what agents can spend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max per call</span>
              <span className="font-medium">$0.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily limit</span>
              <span className="font-medium">$5.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowed categories</span>
              <span className="font-medium">Research, Data, OCR</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Deposits, withdrawals, and settlements will show up here."
      />
    </>
  );
}
