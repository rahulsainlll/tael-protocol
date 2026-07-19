/**
 * Server auth config, shared by the middleware (edge), route handlers (node),
 * and `getSession`. Deliberately mirrors `apps/dashboard/lib/auth.ts` /
 * `apps/dashboard/lib/config.ts` exactly — same `AUTH_SECRET`, same
 * `SESSION_COOKIE` name, same `COOKIE_DOMAIN` — so a session created by signing
 * in on the dashboard is a valid session here too, and vice versa.
 */
export const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "tael-dev-only-secret-change-me-at-least-32-chars";

export const SESSION_COOKIE = "tael_session";

/**
 * Optional shared parent domain (e.g. ".taelprotocol.xyz") for the session
 * cookie. Set on BOTH apps/dashboard and apps/chat in production — that's what
 * lets signing in on `app.taelprotocol.xyz` also authenticate
 * `chat.taelprotocol.xyz`. Unset in local dev, where each app runs on its own
 * `localhost` port and a domain-scoped cookie can't be shared anyway (each app
 * requires its own sign-in there).
 */
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
