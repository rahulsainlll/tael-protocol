import "server-only";
import { and, capabilities, desc, eq, type Capability } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "./current-user";

/** Public capabilities for the marketplace, newest first. */
export async function listPublicCapabilities(): Promise<Capability[]> {
  return db
    .select()
    .from(capabilities)
    .where(eq(capabilities.visibility, "public"))
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
