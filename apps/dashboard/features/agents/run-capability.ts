"use server";

import {
  agents,
  and,
  decryptSecret,
  eq,
  gte,
  payments as paymentsTable,
  sql,
  wallets,
} from "@tael/database";
import { Money } from "@tael/types";
import { buildSignedPayment } from "@tael/stellar";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";
import { fetchUsdcBalance } from "./balance";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const STELLAR_NETWORK = process.env.STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

interface Requirement {
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: { code: string; issuer: string };
  fee?: { payTo: string; amount: string };
}

export interface RunResult {
  ok: boolean;
  /** HTTP status the capability returned. */
  status?: number;
  /** The capability's response body (text). */
  body?: string;
  /** Total USDC the agent paid for this call. */
  paid?: string;
  error?: string;
}

/** Sum the total (amount + fee) this wallet paid in the last 24h, from the ledger. */
async function spentLast24h(payer: string): Promise<Money> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${paymentsTable.amount} + ${paymentsTable.fee}), 0)`,
    })
    .from(paymentsTable)
    .where(and(eq(paymentsTable.payer, payer), gte(paymentsTable.createdAt, since)));
  return Money.parse(row?.total ?? "0");
}

/**
 * Run a capability by paying for it FROM an agent's hot wallet. Enforces the
 * agent's spending policy (max-per-call + rolling 24h limit) BEFORE signing, so
 * a runaway agent can never exceed the caps the owner set. The signing key is
 * decrypted only here, on the server, and never leaves it.
 */
export async function runCapability(input: { agentId: string; slug: string }): Promise<RunResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const [agent] = await db
    .select({
      policy: agents.policy,
      address: wallets.address,
      secretEnc: wallets.secretEnc,
    })
    .from(agents)
    .innerJoin(wallets, eq(agents.walletId, wallets.id))
    .where(and(eq(agents.id, input.agentId), eq(agents.ownerId, user.id)))
    .limit(1);

  if (!agent?.secretEnc) return { ok: false, error: "Agent wallet not found." };

  // 1. Ask the gateway what this call costs (the 402 challenge).
  let req: Requirement;
  try {
    const res = await fetch(`${API_URL}/c/${input.slug}`, { cache: "no-store" });
    if (res.status !== 402) {
      return { ok: false, error: `Capability is not payable (got ${res.status}).` };
    }
    const body = (await res.json()) as { accepts: Requirement[] };
    if (!body.accepts?.[0]) return { ok: false, error: "Invalid payment challenge." };
    req = body.accepts[0];
  } catch {
    return { ok: false, error: "Could not reach the capability." };
  }

  // 2. Total price = builder share + fee.
  const total = req.fee
    ? Money.parse(req.maxAmountRequired).add(Money.parse(req.fee.amount))
    : Money.parse(req.maxAmountRequired);

  // 3. Enforce the spending policy BEFORE spending anything.
  if (agent.policy) {
    const maxPerCall = Money.parse(agent.policy.maxPerCall);
    if (total.isGreaterThan(maxPerCall)) {
      return {
        ok: false,
        error: `Over the per-call cap ($${total.toDecimalString()} > $${agent.policy.maxPerCall}).`,
      };
    }
    const dailyLimit = Money.parse(agent.policy.dailyLimit);
    const projected = (await spentLast24h(agent.address)).add(total);
    if (projected.isGreaterThan(dailyLimit)) {
      return { ok: false, error: `Would exceed the daily limit of $${agent.policy.dailyLimit}.` };
    }
  }

  // 3b. Make sure the wallet actually holds enough USDC (clear error, not a 500).
  const { usdc } = await fetchUsdcBalance(agent.address);
  if (Money.parse(total.toDecimalString()).isGreaterThan(Money.parse(usdc))) {
    return {
      ok: false,
      error: `Not enough USDC. This agent has $${usdc}, the call costs $${total.toDecimalString()}. Fund it first.`,
    };
  }

  // 4. Sign the payment from the agent's hot wallet.
  let xPayment: string;
  try {
    const legs = [{ to: req.payTo, amount: req.maxAmountRequired }];
    if (req.fee) legs.push({ to: req.fee.payTo, amount: req.fee.amount });
    const xdr = await buildSignedPayment({
      secret: decryptSecret(agent.secretEnc),
      network: STELLAR_NETWORK,
      horizonUrl: HORIZON_URL,
      usdcIssuer: req.asset.issuer,
      legs,
    });
    xPayment = Buffer.from(
      JSON.stringify({
        x402Version: 1,
        scheme: "exact",
        network: req.network,
        payload: { transaction: xdr },
      }),
      "utf8",
    ).toString("base64");
  } catch (error) {
    console.error("[run] signing failed:", error);
    return { ok: false, error: "Could not sign the payment (is the wallet funded?)." };
  }

  // 5. Retry the call with the payment proof.
  try {
    const res = await fetch(`${API_URL}/c/${input.slug}`, {
      headers: { "X-PAYMENT": xPayment },
      cache: "no-store",
    });
    const body = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, body, error: friendlyError(res.status) };
    }
    return { ok: true, status: res.status, body, paid: total.toDecimalString() };
  } catch {
    return { ok: false, error: "Couldn't reach the capability. Try again." };
  }
}

/** Map a gateway/upstream status to a message a human can act on. */
function friendlyError(status: number): string {
  if (status === 402) return "The payment was rejected. Check the agent's balance and trustline.";
  if (status === 429) return "The API is rate-limiting requests right now. Try again in a moment.";
  if (status === 404) return "This capability is no longer available.";
  if (status >= 500) return "The agent couldn't pay, or the upstream API is down. Try again.";
  return `The call failed (${status}).`;
}
