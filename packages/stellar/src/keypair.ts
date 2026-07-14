import { Keypair } from "@stellar/stellar-sdk";

/** A freshly generated Stellar keypair. The secret must be encrypted at rest. */
export interface GeneratedKeypair {
  /** Public address (G...), safe to store and display. */
  publicKey: string;
  /** Secret seed (S...). Sensitive — encrypt before persisting, never log. */
  secret: string;
}

/**
 * Generate a new random Stellar keypair, e.g. for an agent hot wallet. The
 * caller is responsible for encrypting `secret` (see @tael/database encryptSecret)
 * before it touches the database, and for never returning it to a client.
 */
export function generateKeypair(): GeneratedKeypair {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}
