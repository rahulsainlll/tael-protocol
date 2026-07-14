import "server-only";
import { agents, capabilities, count, eq } from "@tael/database";
import { db } from "../../lib/db";
import { getCurrentUser } from "../capabilities/current-user";

/** Counts of the user's agents and published capabilities, for the overview. */
export async function getOverviewCounts(): Promise<{ agents: number; capabilities: number }> {
  const user = await getCurrentUser();
  if (!user) return { agents: 0, capabilities: 0 };

  const [a] = await db.select({ n: count() }).from(agents).where(eq(agents.ownerId, user.id));
  const [c] = await db
    .select({ n: count() })
    .from(capabilities)
    .where(eq(capabilities.publisherId, user.id));

  return { agents: a?.n ?? 0, capabilities: c?.n ?? 0 };
}
