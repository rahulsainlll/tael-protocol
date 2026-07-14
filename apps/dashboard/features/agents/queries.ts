import "server-only";
import { agents, desc, eq, wallets } from "@tael/database";
import type { SpendingPolicy } from "@tael/types";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";
import { fetchUsdcBalance } from "./balance";

export interface AgentWallet {
  agentId: string;
  name: string;
  address: string;
  policy: SpendingPolicy | null;
  /** Live on-chain USDC balance. */
  usdc: string;
  funded: boolean;
  createdAt: Date;
}

/**
 * List the signed-in user's agents with their hot wallet + live chain balance.
 * Deliberately selects only non-sensitive columns — `secret_enc` never leaves
 * the server, let alone reaches a query the page can serialize to the client.
 */
export async function listAgentWallets(): Promise<AgentWallet[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({
      agentId: agents.id,
      name: agents.name,
      policy: agents.policy,
      address: wallets.address,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .innerJoin(wallets, eq(agents.walletId, wallets.id))
    .where(eq(agents.ownerId, user.id))
    .orderBy(desc(agents.createdAt));

  return Promise.all(
    rows.map(async (r) => {
      const { usdc, funded } = await fetchUsdcBalance(r.address);
      return {
        agentId: r.agentId,
        name: r.name,
        address: r.address,
        policy: r.policy,
        usdc,
        funded,
        createdAt: r.createdAt,
      };
    }),
  );
}
