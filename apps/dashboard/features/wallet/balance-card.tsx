import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";

export function BalanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Wallet balance</CardDescription>
        <CardTitle className="text-3xl">
          $20.00 <span className="text-base font-normal text-muted-foreground">USDC</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button>
          <ArrowDownToLine /> Deposit
        </Button>
        <Button variant="outline">
          <ArrowUpFromLine /> Withdraw
        </Button>
      </CardContent>
    </Card>
  );
}
