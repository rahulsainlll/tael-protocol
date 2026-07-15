"use server";

import { revalidatePath } from "next/cache";
import { eq, users } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

/** Update the signed-in user's optional display name. */
export async function updateDisplayName(name: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const trimmed = name.trim().slice(0, 60);
  await db
    .update(users)
    .set({ displayName: trimmed || null, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  revalidatePath("/settings");
  return { ok: true };
}
