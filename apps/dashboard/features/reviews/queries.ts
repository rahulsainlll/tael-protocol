import "server-only";
import {
  and,
  capabilities,
  desc,
  eq,
  inArray,
  payments as paymentsTable,
  reviews,
  users,
  wallets,
} from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  reviewer: string;
  createdAt: Date;
}

export interface ReviewSummary {
  average: number;
  count: number;
  reviews: ReviewRow[];
}

/** Reviews + average for a capability (public). Reviewer shown by wallet address. */
export async function getCapabilityReviews(capabilityId: string): Promise<ReviewSummary> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      reviewer: users.walletAddress,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.capabilityId, capabilityId))
    .orderBy(desc(reviews.createdAt));

  const list: ReviewRow[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    reviewer: r.reviewer,
    createdAt: r.createdAt,
  }));

  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { average, count, reviews: list };
}

/** Whether the signed-in user may review this capability (paid + not yet reviewed). */
export async function canReview(capabilityId: string): Promise<{ canReview: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { canReview: false };

  const already = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.capabilityId, capabilityId), eq(reviews.reviewerId, user.id)))
    .limit(1);
  if (already[0]) return { canReview: false };

  // Has any of the user's wallets paid for this capability?
  const addresses = (
    await db.select({ address: wallets.address }).from(wallets).where(eq(wallets.ownerId, user.id))
  ).map((r) => r.address);
  if (!addresses.length) return { canReview: false };

  const hit = await db
    .select({ id: paymentsTable.id })
    .from(paymentsTable)
    .where(
      and(eq(paymentsTable.capabilityId, capabilityId), inArray(paymentsTable.payer, addresses)),
    )
    .limit(1);

  return { canReview: Boolean(hit[0]) };
}

/** The signed-in user's own reviews, for the Reviews page. */
export async function listMyReviews(): Promise<
  { id: string; rating: number; comment: string | null; capability: string; createdAt: Date }[]
> {
  const user = await getCurrentUser();
  if (!user) return [];
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      capability: capabilities.name,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(capabilities, eq(reviews.capabilityId, capabilities.id))
    .where(eq(reviews.reviewerId, user.id))
    .orderBy(desc(reviews.createdAt));
}
