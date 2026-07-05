import { NextResponse } from "next/server";
import { createSessionToken } from "@tael/auth";
import { stellarAddressSchema } from "@tael/types";
import { AUTH_SECRET, SESSION_COOKIE } from "../../../../lib/config";

/**
 * Testnet-only convenience login: create a session for a Stellar address WITHOUT
 * a signature. Disabled on mainnet. This unblocks dev/demo while the full
 * wallet-signature flow is being sorted out — it is NOT secure (no proof of
 * ownership) and must never be enabled on mainnet.
 */
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet") {
    return NextResponse.json({ error: "Dev login is disabled on mainnet" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { address?: string };
  const parsed = stellarAddressSchema.safeParse(body.address?.trim());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid Stellar address (G…)" }, { status: 400 });
  }

  const token = await createSessionToken(parsed.data, AUTH_SECRET);
  const response = NextResponse.json({ ok: true, address: parsed.data });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
