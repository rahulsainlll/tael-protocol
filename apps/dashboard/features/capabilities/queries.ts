import "server-only";
import { and, capabilities, desc, eq, ne, type Capability } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "./current-user";

/** Public, published capabilities for the marketplace, newest first. Excludes
 *  drafts; includes both pending and verified (the badge distinguishes them). */
export async function listPublicCapabilities(): Promise<Capability[]> {
  return db
    .select()
    .from(capabilities)
    .where(and(eq(capabilities.visibility, "public"), ne(capabilities.status, "draft")))
    .orderBy(desc(capabilities.createdAt));
}

/** A single public capability by its slug (for the marketplace detail page). */
export async function getPublicCapabilityBySlug(slug: string): Promise<Capability | null> {
  const rows = await db
    .select()
    .from(capabilities)
    .where(and(eq(capabilities.slug, slug), eq(capabilities.visibility, "public")))
    .limit(1);
  return rows[0] ?? null;
}

/** The signed-in user's own capabilities (any visibility). */
export async function listMyCapabilities(): Promise<Capability[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return db
    .select()
    .from(capabilities)
    .where(eq(capabilities.publisherId, user.id))
    .orderBy(desc(capabilities.createdAt));
}

/** Look up a single capability owned by the current user. */
export async function getMyCapability(id: string): Promise<Capability | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db
    .select()
    .from(capabilities)
    .where(and(eq(capabilities.id, id), eq(capabilities.publisherId, user.id)))
    .limit(1);
  return rows[0] ?? null;
}

/** Wallets allowed to edit any capability (Tael admins), from env. */
const ADMIN_WALLETS = new Set(
  (process.env.ADMIN_WALLET_ADDRESSES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

/**
 * Load a capability the current user may edit: their own, or any capability if
 * they are a Tael admin. Returns null (→ 404) otherwise.
 */
export async function getEditableCapability(id: string): Promise<Capability | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const [row] = await db.select().from(capabilities).where(eq(capabilities.id, id)).limit(1);
  if (!row) return null;
  const canEdit = row.publisherId === user.id || ADMIN_WALLETS.has(user.walletAddress);
  return canEdit ? row : null;
}
