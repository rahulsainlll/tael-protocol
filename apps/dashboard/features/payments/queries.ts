import "server-only";
import {
  capabilities,
  desc,
  eq,
  inArray,
  payments as paymentsTable,
  wallets,
} from "@tael/database";
import { Money } from "@tael/types";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

export interface ActivityRow {
  id: string;
  direction: "earned" | "spent";
  /** Capability the payment was for (or a fallback label). */
  capability: string;
  /** The other party's Stellar address. */
  counterparty: string;
  /** Signed total in USDC: what you earned (net) or spent (incl. fee). */
  amount: string;
  status: string;
  createdAt: Date;
}

export interface PaymentsData {
  earned: string;
  spent: string;
  activity: ActivityRow[];
}

/** Stellar addresses of the user's agent wallets (what "spent" is measured against). */
async function myWalletAddresses(userId: string): Promise<string[]> {
  const rows = await db
    .select({ address: wallets.address })
    .from(wallets)
    .where(eq(wallets.ownerId, userId));
  return rows.map((r) => r.address);
}

/**
 * Earnings + spending for the signed-in user, from the settlement ledger.
 *   - Earned: payments for capabilities they publish (net amount received).
 *   - Spent: payments made by their agent wallets (amount + fee paid).
 * Returns totals plus a merged, most-recent-first activity feed.
 */
export async function getPaymentsData(): Promise<PaymentsData> {
  const user = await getCurrentUser();
  if (!user) return { earned: "0", spent: "0", activity: [] };

  // Earnings: join payments → capabilities the user publishes.
  const earnedRows = await db
    .select({
      id: paymentsTable.id,
      capability: capabilities.name,
      counterparty: paymentsTable.payer,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      createdAt: paymentsTable.createdAt,
    })
    .from(paymentsTable)
    .innerJoin(capabilities, eq(paymentsTable.capabilityId, capabilities.id))
    .where(eq(capabilities.publisherId, user.id))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(50);

  // Spending: payments made by any of the user's wallets.
  const addresses = await myWalletAddresses(user.id);
  const spentRows = addresses.length
    ? await db
        .select({
          id: paymentsTable.id,
          capability: capabilities.name,
          counterparty: paymentsTable.payee,
          amount: paymentsTable.amount,
          fee: paymentsTable.fee,
          status: paymentsTable.status,
          createdAt: paymentsTable.createdAt,
        })
        .from(paymentsTable)
        .leftJoin(capabilities, eq(paymentsTable.capabilityId, capabilities.id))
        .where(inArray(paymentsTable.payer, addresses))
        .orderBy(desc(paymentsTable.createdAt))
        .limit(50)
    : [];

  let earned = Money.zero();
  const earnedActivity: ActivityRow[] = earnedRows.map((r) => {
    earned = earned.add(Money.parse(r.amount));
    return {
      id: `in-${r.id}`,
      direction: "earned" as const,
      capability: r.capability,
      counterparty: r.counterparty,
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt,
    };
  });

  let spent = Money.zero();
  const spentActivity: ActivityRow[] = spentRows.map((r) => {
    const total = Money.parse(r.amount).add(Money.parse(r.fee));
    spent = spent.add(total);
    return {
      id: `out-${r.id}`,
      direction: "spent" as const,
      capability: r.capability ?? "Capability",
      counterparty: r.counterparty,
      amount: total.toDecimalString(),
      status: r.status,
      createdAt: r.createdAt,
    };
  });

  const activity = [...earnedActivity, ...spentActivity]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);

  return { earned: earned.toDecimalString(), spent: spent.toDecimalString(), activity };
}
