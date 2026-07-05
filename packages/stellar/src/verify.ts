import { createHash } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { type StellarAddress } from "@tael/types";

const SEP53_PREFIX = "Stellar Signed Message:\n";

function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

/**
 * Verify that `signature` is a valid ed25519 signature of `message` by the
 * Stellar account `address` — proof of wallet ownership during Sign-In-With-Stellar.
 *
 * Wallets differ in what bytes they actually sign for a "message" (raw UTF-8, a
 * SHA-256 of it, or the SEP-53 prefixed hash) and in how they encode the
 * signature (base64 or hex). We accept any combination that validates — every
 * candidate is derived from OUR challenge message, so this stays secure while
 * working across Freighter / Albedo / xBull / etc. Returns false on bad input.
 */
export function verifySignedMessage(
  address: StellarAddress,
  message: string,
  signature: string,
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(address);
    const raw = Buffer.from(message, "utf8");

    const payloads: Buffer[] = [
      raw,
      sha256(raw),
      sha256(Buffer.concat([Buffer.from(SEP53_PREFIX, "utf8"), raw])),
    ];
    const signatures: Buffer[] = [Buffer.from(signature, "base64"), Buffer.from(signature, "hex")];

    return payloads.some((payload) =>
      signatures.some((sig) => sig.length === 64 && keypair.verify(payload, sig)),
    );
  } catch {
    return false;
  }
}
