import "server-only";
import {
  and,
  capabilities,
  eq,
  gte,
  inArray,
  payments as paymentsTable,
  sql,
  wallets,
} from "@tael/database";
import { Money } from "@tael/types";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

const DAYS = 30;

export interface DayPoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  earned: number;
  spent: number;
  calls: number;
}

export interface AnalyticsData {
  totalEarned: string;
  totalSpent: string;
  totalCalls: number;
  earnedCalls: number;
  series: DayPoint[];
}

/**
 * Daily earnings, spend, and call counts over the last 30 days, from the
 * settlement ledger. Earnings = payments for the user's capabilities; spend =
 * payments made by the user's agent wallets.
 */
export async function getAnalytics(): Promise<AnalyticsData> {
  const user = await getCurrentUser();
  const empty: AnalyticsData = {
    totalEarned: "0",
    totalSpent: "0",
    totalCalls: 0,
    earnedCalls: 0,
    series: buildSeries([], []),
  };
  if (!user) return empty;

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const day = sql<string>`to_char(${paymentsTable.createdAt}, 'YYYY-MM-DD')`;

  // Earnings per day (payments for capabilities this user publishes).
  const earnedRows = await db
    .select({
      date: day,
      total: sql<string>`coalesce(sum(${paymentsTable.amount}), 0)`,
      calls: sql<number>`count(*)::int`,
    })
    .from(paymentsTable)
    .innerJoin(capabilities, eq(paymentsTable.capabilityId, capabilities.id))
    .where(and(eq(capabilities.publisherId, user.id), gte(paymentsTable.createdAt, since)))
    .groupBy(day);

  // Spend per day (payments made by this user's agent wallets).
  const addresses = (
    await db.select({ address: wallets.address }).from(wallets).where(eq(wallets.ownerId, user.id))
  ).map((r) => r.address);

  const spentRows = addresses.length
    ? await db
        .select({
          date: day,
          total: sql<string>`coalesce(sum(${paymentsTable.amount} + ${paymentsTable.fee}), 0)`,
          calls: sql<number>`count(*)::int`,
        })
        .from(paymentsTable)
        .where(and(inArray(paymentsTable.payer, addresses), gte(paymentsTable.createdAt, since)))
        .groupBy(day)
    : [];

  const series = buildSeries(earnedRows, spentRows);

  const totalEarned = earnedRows.reduce((m, r) => m.add(Money.parse(r.total)), Money.zero());
  const totalSpent = spentRows.reduce((m, r) => m.add(Money.parse(r.total)), Money.zero());
  const earnedCalls = earnedRows.reduce((n, r) => n + r.calls, 0);
  const totalCalls = spentRows.reduce((n, r) => n + r.calls, 0);

  return {
    totalEarned: totalEarned.toDecimalString(),
    totalSpent: totalSpent.toDecimalString(),
    totalCalls,
    earnedCalls,
    series,
  };
}

interface DayAgg {
  date: string;
  total: string;
  calls: number;
}

/** Fill a continuous 30-day series so gaps render as zero, not missing bars. */
function buildSeries(earned: DayAgg[], spent: DayAgg[]): DayPoint[] {
  const earnedMap = new Map(earned.map((r) => [r.date, r]));
  const spentMap = new Map(spent.map((r) => [r.date, r]));
  const out: DayPoint[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const date = d.toISOString().slice(0, 10);
    const e = earnedMap.get(date);
    const s = spentMap.get(date);
    out.push({
      date,
      earned: e ? Number(e.total) : 0,
      spent: s ? Number(s.total) : 0,
      calls: (e?.calls ?? 0) + (s?.calls ?? 0),
    });
  }
  return out;
}
