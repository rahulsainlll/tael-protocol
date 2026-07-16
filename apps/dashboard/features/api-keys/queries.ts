import "server-only";
import { agents, apiKeys, desc, eq, wallets } from "@tael/database";
import type { SpendingPolicy } from "@tael/types";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  /** The Card this key spends from, if linked. */
  card: {
    id: string;
    name: string;
    address: string | null;
    policy: SpendingPolicy | null;
  } | null;
}

/** List the signed-in user's API keys with their linked Card. Never selects the hash. */
export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
      cardId: agents.id,
      cardName: agents.name,
      cardPolicy: agents.policy,
      cardAddress: wallets.address,
    })
    .from(apiKeys)
    .leftJoin(agents, eq(apiKeys.agentId, agents.id))
    .leftJoin(wallets, eq(agents.walletId, wallets.id))
    .where(eq(apiKeys.ownerId, user.id))
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    prefix: r.prefix,
    lastUsedAt: r.lastUsedAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
    card: r.cardId
      ? { id: r.cardId, name: r.cardName ?? "Card", address: r.cardAddress, policy: r.cardPolicy }
      : null,
  }));
}
