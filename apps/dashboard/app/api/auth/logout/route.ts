import { NextResponse } from "next/server";
import { SESSION_COOKIE, COOKIE_DOMAIN } from "../../../../lib/config";

/** Clear the session cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", domain: COOKIE_DOMAIN, maxAge: 0 });
  return response;
}
