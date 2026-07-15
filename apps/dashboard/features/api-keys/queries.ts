import "server-only";
import { apiKeys, desc, eq } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

/** List the signed-in user's API keys. Never selects the hash. */
export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.ownerId, user.id))
    .orderBy(desc(apiKeys.createdAt));
}
