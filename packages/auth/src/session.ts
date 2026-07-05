import { SignJWT, jwtVerify } from "jose";
import { TaelError } from "@tael/types";
import { secretKey } from "./secret";

const DEFAULT_SESSION_TTL = "7d";

export interface Session {
  /** The authenticated Stellar address (the user's identity). */
  address: string;
}

/** Mint a session token for an authenticated address (goes in an httpOnly cookie). */
export async function createSessionToken(
  address: string,
  secret: string,
  ttl: string = DEFAULT_SESSION_TTL,
): Promise<string> {
  return new SignJWT({ address })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(address)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secretKey(secret));
}

/**
 * Verify a session token. Uses only jose (Web Crypto), so this is safe to call
 * from the Next.js middleware (edge runtime) — it never pulls in the Stellar SDK.
 */
export async function verifySessionToken(token: string, secret: string): Promise<Session> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    const address =
      typeof payload.address === "string"
        ? payload.address
        : typeof payload.sub === "string"
          ? payload.sub
          : "";
    if (!address) {
      throw new Error("Session has no address");
    }
    return { address };
  } catch (cause) {
    throw new TaelError("UNAUTHORIZED", "Invalid or expired session", { cause });
  }
}
