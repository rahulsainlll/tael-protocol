"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { agents, encryptSecret, wallets } from "@tael/database";
import { generateKeypair } from "@tael/stellar";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  maxPerCall: z.string().regex(/^\d+(\.\d+)?$/, "Enter an amount, e.g. 0.10"),
  dailyLimit: z.string().regex(/^\d+(\.\d+)?$/, "Enter an amount, e.g. 5.00"),
});

export interface CreateAgentResult {
  ok: boolean;
  /** The new hot wallet's public address to fund. */
  address?: string;
  error?: string;
}

/**
 * Create an agent with a fresh hot wallet: generate a Stellar keypair, encrypt
 * the secret at rest, and store the wallet + agent (with its spending policy).
 * Returns only the PUBLIC address — the secret never leaves the server.
 */
export async function createAgent(input: {
  name: string;
  maxPerCall: string;
  dailyLimit: string;
}): Promise<CreateAgentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = createAgentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, maxPerCall, dailyLimit } = parsed.data;

  const keypair = generateKeypair();

  try {
    await db.transaction(async (tx) => {
      const [wallet] = await tx
        .insert(wallets)
        .values({
          ownerId: user.id,
          address: keypair.publicKey,
          label: name,
          secretEnc: encryptSecret(keypair.secret),
        })
        .returning({ id: wallets.id });

      await tx.insert(agents).values({
        ownerId: user.id,
        name,
        walletId: wallet!.id,
        policy: { maxPerCall, dailyLimit, blockedPublishers: [] },
      });
    });
  } catch (error) {
    console.error("[agents] create failed:", error);
    return { ok: false, error: "Could not create the agent. Try again." };
  }

  revalidatePath("/agents");
  return { ok: true, address: keypair.publicKey };
}
