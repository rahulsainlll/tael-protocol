import { cookies } from "next/headers";
import { verifySessionToken, type Session } from "@tael/auth";
import { AUTH_SECRET, SESSION_COOKIE } from "./config";

/**
 * Read + verify the Sign-In-With-Stellar session from the httpOnly cookie.
 * Returns the authenticated Stellar address, or null if unauthenticated.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token, AUTH_SECRET);
  } catch {
    return null;
  }
}
