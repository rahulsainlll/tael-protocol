import "server-only";
import { agents, and, desc, eq, wallets } from "@tael/database";
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
  /** Has a USDC trustline, so it can receive USDC. */
  ready: boolean;
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
      const { usdc, funded, ready } = await fetchUsdcBalance(r.address);
      return {
        agentId: r.agentId,
        name: r.name,
        address: r.address,
        policy: r.policy,
        usdc,
        funded,
        ready,
        createdAt: r.createdAt,
      };
    }),
  );
}

export interface CardPickerOption {
  id: string;
  name: string;
  policy: SpendingPolicy | null;
}

/**
 * The user's Cards for a picker (e.g. linking an API key), DB-only — no Horizon
 * balance calls, so it's fast to render inline in a dialog.
 */
export async function listCardsForPicker(): Promise<CardPickerOption[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return db
    .select({ id: agents.id, name: agents.name, policy: agents.policy })
    .from(agents)
    .where(eq(agents.ownerId, user.id))
    .orderBy(desc(agents.createdAt));
}

export interface AgentOption {
  agentId: string;
  name: string;
  policy: SpendingPolicy | null;
  /** Live on-chain USDC balance, so the picker can flag unfunded agents. */
  usdc: string;
}

/**
 * List the user's agents for the run picker, with each wallet's live USDC
 * balance so the UI can flag ones that can't pay. Balance calls run in parallel.
 */
export async function listAgentsForRun(): Promise<AgentOption[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await db
    .select({
      agentId: agents.id,
      name: agents.name,
      policy: agents.policy,
      address: wallets.address,
    })
    .from(agents)
    .innerJoin(wallets, eq(agents.walletId, wallets.id))
    .where(eq(agents.ownerId, user.id))
    .orderBy(desc(agents.createdAt));

  return Promise.all(
    rows.map(async (r) => {
      const { usdc } = await fetchUsdcBalance(r.address);
      return { agentId: r.agentId, name: r.name, policy: r.policy, usdc };
    }),
  );
}

/** Fetch a single agent (ownership-checked) with its live wallet state. */
export async function getAgentDetail(agentId: string): Promise<AgentWallet | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [r] = await db
    .select({
      agentId: agents.id,
      name: agents.name,
      policy: agents.policy,
      address: wallets.address,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .innerJoin(wallets, eq(agents.walletId, wallets.id))
    .where(and(eq(agents.id, agentId), eq(agents.ownerId, user.id)))
    .limit(1);

  if (!r) return null;
  const { usdc, funded, ready } = await fetchUsdcBalance(r.address);
  return {
    agentId: r.agentId,
    name: r.name,
    address: r.address,
    policy: r.policy,
    usdc,
    funded,
    ready,
    createdAt: r.createdAt,
  };
}
