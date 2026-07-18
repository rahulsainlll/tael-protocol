/**
 * Server auth config, shared by the middleware (edge), route handlers (node),
 * and `getSession`. `AUTH_SECRET` signs the session + challenge JWTs — set a
 * strong value in the environment for production (the fallback is dev-only).
 */
export const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "tael-dev-only-secret-change-me-at-least-32-chars";

export const SESSION_COOKIE = "tael_session";

/**
* Optional shared parent domain (e.g. ".taelprotocol.xyz") for the session
* cookie. Unset in local dev. Set on both apps/dashboard and apps/chat in
* production so signing in on the dashboard also authenticates chat.
*/

export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
