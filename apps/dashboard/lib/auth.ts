import { cookies } from "next/headers";

const SESSION_COOKIE = "tael_session";

export interface Session {
  user: { name: string; email: string };
}

/**
 * Reads the stub session cookie set by the demo login page. Architecture only —
 * replace with @tael/auth (Better Auth + passkeys) when authentication ships.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  if (!store.has(SESSION_COOKIE)) return null;
  return { user: { name: "Demo User", email: "demo@tael.dev" } };
}
