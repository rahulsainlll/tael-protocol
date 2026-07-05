import { NextResponse } from "next/server";
import { createChallenge } from "@tael/auth";
import { AUTH_SECRET } from "../../../../lib/config";

/** Issue a Sign-In-With-Stellar challenge for the given address. */
export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }
  const challenge = await createChallenge(address, AUTH_SECRET);
  return NextResponse.json(challenge);
}
