import { NextResponse } from "next/server";
import { createSessionToken, verifyChallengeToken } from "@tael/auth";
import { verifySignedMessage } from "@tael/stellar";
import { AUTH_SECRET, COOKIE_DOMAIN, SESSION_COOKIE } from "../../../../lib/config";

interface VerifyBody {
  address?: string;
  signature?: string;
  challengeToken?: string;
}

/**
 * Verify a signed challenge and, on success, set the session cookie.
 * Runs on the Node runtime (uses the Stellar SDK for signature verification).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const { address, signature, challengeToken } = body;

  if (!address || !signature || !challengeToken) {
    return NextResponse.json(
      { error: "Missing address, signature, or challengeToken" },
      { status: 400 },
    );
  }

  let message: string;
  try {
    const challenge = await verifyChallengeToken(challengeToken, AUTH_SECRET);
    if (challenge.address !== address) {
      return NextResponse.json({ error: "Address does not match challenge" }, { status: 401 });
    }
    message = challenge.message;
  } catch {
    return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 401 });
  }

  if (!verifySignedMessage(address, message, signature)) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  const token = await createSessionToken(address, AUTH_SECRET);
  const response = NextResponse.json({ ok: true, address });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
