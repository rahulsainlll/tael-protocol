import { NextResponse } from "next/server";
import { COOKIE_DOMAIN, SESSION_COOKIE } from "../../../../lib/config";

/** Clear the session cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", domain: COOKIE_DOMAIN, maxAge: 0 });
  return response;
}
