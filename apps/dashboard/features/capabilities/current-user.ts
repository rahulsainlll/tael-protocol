import "server-only";
import { eq, users, type User } from "@tael/database";
import { db } from "../../lib/db";
import { getSession } from "../../lib/auth";

/**
 * Resolve the signed-in wallet to a `users` row, creating it on first use
 * (accounts are created lazily the first time a wallet does something that
 * needs persistence). Returns null when not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, session.address))
    .limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(users)
    .values({ walletAddress: session.address })
    .onConflictDoUpdate({ target: users.walletAddress, set: { updatedAt: new Date() } })
    .returning();
  return created ?? null;
}
