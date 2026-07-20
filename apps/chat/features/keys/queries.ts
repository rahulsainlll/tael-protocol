import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { agents, and, apiKeys, eq, wallets } from "@tael/database";
import type { SpendingPolicy } from "@tael/types";
import { db } from "../../lib/db";

export interface CardSummary {
  id: string;
  name: string;
  address: string | null;
  policy: SpendingPolicy | null;
}

/** The signed-in user's Cards (agent hot wallets), for the create_api_key card picker. */
export async function listCards(userId: string): Promise<CardSummary[]> {
  const rows = await db
    .select({
      id: agents.id,
      name: agents.name,
      policy: agents.policy,
      address: wallets.address,
    })
    .from(agents)
    .leftJoin(wallets, eq(agents.walletId, wallets.id))
    .where(eq(agents.ownerId, userId));
  return rows;
}

export interface CreateApiKeyResult {
  ok: boolean;
  /** The raw key — returned ONCE, never stored or retrievable again. */
  key?: string;
  prefix?: string;
  error?: string;
  /** Echoed back so the caller can confirm the linked Card + its caps to the user. */
  card?: CardSummary;
}

/**
 * Create an API key for `userId`, optionally linked to one of their Cards.
 * Same generation scheme as apps/dashboard's createApiKey (SHA-256 hash
 * stored, raw key returned exactly once) so a key created from chat is
 * indistinguishable from one created in the dashboard.
 */
export async function createApiKey(
  userId: string,
  name: string,
  cardId?: string | null,
): Promise<CreateApiKeyResult> {
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: "Name is required." };
  if (trimmedName.length > 60) return { ok: false, error: "Name must be 60 characters or fewer." };

  let linkedCard: CardSummary | undefined;
  if (cardId) {
    const [card] = await db
      .select({
        id: agents.id,
        name: agents.name,
        policy: agents.policy,
        address: wallets.address,
      })
      .from(agents)
      .leftJoin(wallets, eq(agents.walletId, wallets.id))
      .where(and(eq(agents.id, cardId), eq(agents.ownerId, userId)))
      .limit(1);
    if (!card) return { ok: false, error: "That Card was not found." };
    linkedCard = card;
  }

  const raw = `tael_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 16); // "tael_live_" + 6 chars

  try {
    await db.insert(apiKeys).values({
      ownerId: userId,
      name: trimmedName,
      prefix,
      keyHash,
      agentId: linkedCard?.id ?? null,
    });
  } catch (error) {
    console.error("[chat] create_api_key failed:", error);
    return { ok: false, error: "Could not create the key. Try again." };
  }

  return { ok: true, key: raw, prefix, card: linkedCard };
}
