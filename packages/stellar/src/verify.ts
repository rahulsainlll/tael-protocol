import { Keypair } from "@stellar/stellar-sdk";
import { type StellarAddress } from "@tael/types";

/**
 * Verify that `signatureBase64` is a valid ed25519 signature of `message` by the
 * Stellar account `address`. Used to prove wallet ownership during
 * Sign-In-With-Stellar (the wallet signs the challenge message; the server checks
 * it here). Returns `false` on any malformed input rather than throwing.
 */
export function verifySignedMessage(
  address: StellarAddress,
  message: string,
  signatureBase64: string,
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(address);
    return keypair.verify(Buffer.from(message, "utf8"), Buffer.from(signatureBase64, "base64"));
  } catch {
    return false;
  }
}
