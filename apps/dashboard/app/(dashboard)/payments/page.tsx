import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@tael/ui";
import { PageHeader } from "../../../components/page-header";

// Sample rows for the table UI only — replaced by live @tael/api data later.
const samplePayments = [
  {
    id: "pay_1",
    capability: "Document OCR",
    direction: "Outgoing",
    amount: "-$0.02",
    status: "Settled",
    date: "2026-07-03",
  },
  {
    id: "pay_2",
    capability: "Live Web Search",
    direction: "Outgoing",
    amount: "-$0.01",
    status: "Settled",
    date: "2026-07-03",
  },
  {
    id: "pay_3",
    capability: "Company Records API",
    direction: "Outgoing",
    amount: "-$0.05",
    status: "Settled",
    date: "2026-07-02",
  },
];

export default function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Payments"
        description="Incoming and outgoing settlements across your wallets."
      />
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samplePayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.capability}</TableCell>
                <TableCell>{payment.direction}</TableCell>
                <TableCell>{payment.amount}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{payment.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{payment.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing sample data — connect a wallet to see live settlements.
      </p>
    </>
  );
}
