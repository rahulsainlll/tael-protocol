import { SignJWT, jwtVerify } from "jose";
import { TaelError } from "@tael/types";
import { secretKey } from "./secret";

/** How long a signing challenge stays valid. */
const CHALLENGE_TTL_SECONDS = 300;

export interface Challenge {
  /** Human-readable message the wallet signs. */
  message: string;
  /** Stateless, short-lived JWT that binds the nonce + address + message (no server store needed). */
  challengeToken: string;
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Issue a Sign-In-With-Stellar challenge for an address. The wallet signs
 * `message`; `challengeToken` is returned to the client and sent back on verify
 * — this gives replay protection without any server-side session store.
 */
export async function createChallenge(address: string, secret: string): Promise<Challenge> {
  const nonce = randomNonce();
  const message = [
    "Sign in to Tael",
    "",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
  ].join("\n");

  const challengeToken = await new SignJWT({ address, nonce, message })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_TTL_SECONDS}s`)
    .sign(secretKey(secret));

  return { message, challengeToken };
}

/** Verify a challenge token and recover the address + exact message that was signed. */
export async function verifyChallengeToken(
  token: string,
  secret: string,
): Promise<{ address: string; message: string }> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    const address = typeof payload.address === "string" ? payload.address : "";
    const message = typeof payload.message === "string" ? payload.message : "";
    if (!address || !message) {
      throw new Error("Malformed challenge payload");
    }
    return { address, message };
  } catch (cause) {
    throw new TaelError("UNAUTHORIZED", "Invalid or expired challenge", { cause });
  }
}
