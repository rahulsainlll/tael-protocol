import { createHash } from "node:crypto";
import {
  agents,
  and,
  apiKeys,
  eq,
  gte,
  payments,
  sql,
  wallets,
  type Database,
} from "@tael/database";
import { type AuthorizedKey, type KeyAuthorizer } from "./key.service";

/**
 * Postgres adapter for {@link KeyAuthorizer}. Looks up a key by the SHA-256 hash
 * of the raw token (the raw key is never stored), joins to its linked Card's
 * wallet, and answers the daily-spend question from the payments ledger.
 *
 * With no database configured (tests) every method is a safe no-op, so the
 * key path simply doesn't authenticate — the wallet/x402 path is unaffected.
 */
export class DbApiKeyRepository implements KeyAuthorizer {
  constructor(private readonly db: Database | undefined) {}

  async authorize(rawKey: string): Promise<AuthorizedKey | null> {
    if (!this.db) return null;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const [row] = await this.db
      .select({
        id: apiKeys.id,
        ownerId: apiKeys.ownerId,
        revokedAt: apiKeys.revokedAt,
        agentId: apiKeys.agentId,
        address: wallets.address,
        secretEnc: wallets.secretEnc,
        policy: agents.policy,
      })
      .from(apiKeys)
      .leftJoin(agents, eq(apiKeys.agentId, agents.id))
      .leftJoin(wallets, eq(agents.walletId, wallets.id))
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!row || row.revokedAt) return null;

    const card =
      row.agentId && row.address && row.secretEnc
        ? {
            agentId: row.agentId,
            address: row.address,
            secretEnc: row.secretEnc,
            policy: row.policy,
          }
        : null;
    return { id: row.id, ownerId: row.ownerId, card };
  }

  async touch(keyId: string): Promise<void> {
    if (!this.db) return;
    await this.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyId));
  }

  async spentSince(payer: string, since: Date): Promise<string> {
    if (!this.db) return "0";
    const [row] = await this.db
      .select({
        total: sql<string>`coalesce(sum(${payments.amount} + ${payments.fee}), 0)`,
      })
      .from(payments)
      .where(and(eq(payments.payer, payer), gte(payments.createdAt, since)));
    return row?.total ?? "0";
  }
}
