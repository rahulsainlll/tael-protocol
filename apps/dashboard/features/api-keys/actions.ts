"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, apiKeys, eq, isNull } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

const nameSchema = z.string().trim().min(1, "Name is required").max(60);

export interface CreateKeyResult {
  ok: boolean;
  /** The raw key — shown ONCE, never stored or retrievable again. */
  key?: string;
  error?: string;
}

/**
 * Create an API key: generate a random token, store only its SHA-256 hash plus a
 * short prefix for identification, and return the raw key exactly once. The raw
 * key is never persisted and cannot be recovered later.
 */
export async function createApiKey(name: string): Promise<CreateKeyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  const raw = `tael_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 16); // "tael_live_" + 6 chars

  try {
    await db.insert(apiKeys).values({ ownerId: user.id, name: parsed.data, prefix, keyHash });
  } catch (error) {
    console.error("[api-keys] create failed:", error);
    return { ok: false, error: "Could not create the key. Try again." };
  }

  revalidatePath("/api-keys");
  return { ok: true, key: raw };
}

/** Revoke a key the signed-in user owns. Idempotent. */
export async function revokeApiKey(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  try {
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.ownerId, user.id), isNull(apiKeys.revokedAt)));
  } catch (error) {
    console.error("[api-keys] revoke failed:", error);
    return { ok: false, error: "Could not revoke the key. Try again." };
  }

  revalidatePath("/api-keys");
  return { ok: true };
}
