"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, inArray, payments as paymentsTable, reviews, wallets } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

/**
 * Leave a review for a capability. Only a user whose wallet has actually paid for
 * the capability may review it, and only once. The slug is used to revalidate the
 * capability page.
 */
export async function submitReview(input: {
  capabilityId: string;
  slug: string;
  rating: number;
  comment?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = reviewSchema.safeParse({ rating: input.rating, comment: input.comment });
  if (!parsed.success) return { ok: false, error: "Pick a rating from 1 to 5." };

  // Verify the user has paid for this capability from one of their wallets.
  const addresses = (
    await db.select({ address: wallets.address }).from(wallets).where(eq(wallets.ownerId, user.id))
  ).map((r) => r.address);
  if (!addresses.length) {
    return { ok: false, error: "Only buyers can review. Pay for a call first." };
  }
  const paid = await db
    .select({ id: paymentsTable.id })
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.capabilityId, input.capabilityId),
        inArray(paymentsTable.payer, addresses),
      ),
    )
    .limit(1);
  if (!paid[0]) return { ok: false, error: "Only buyers can review. Pay for a call first." };

  try {
    await db
      .insert(reviews)
      .values({
        capabilityId: input.capabilityId,
        reviewerId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      })
      .onConflictDoUpdate({
        target: [reviews.capabilityId, reviews.reviewerId],
        set: { rating: parsed.data.rating, comment: parsed.data.comment || null },
      });
  } catch (error) {
    console.error("[reviews] submit failed:", error);
    return { ok: false, error: "Could not save the review. Try again." };
  }

  revalidatePath(`/marketplace/${input.slug}`);
  revalidatePath("/reviews");
  return { ok: true };
}
