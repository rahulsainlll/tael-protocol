import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Authenticated symmetric encryption (AES-256-GCM) for secrets at rest — namely
 * a developer's upstream API key stored on a capability. We store, per value:
 *   base64(iv).base64(authTag).base64(ciphertext)
 * so each value is self-describing and tamper-evident.
 *
 * The key comes from `ENCRYPTION_KEY`: 32 bytes, hex (64 chars) or base64.
 * Generate one with: openssl rand -hex 32
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set");
  }
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to 32 bytes (use `openssl rand -hex 32`)");
  }
  return key;
}

/** Encrypt a UTF-8 string. Returns `iv.tag.ciphertext`, all base64. */
export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

/** Decrypt a value produced by {@link encryptSecret}. Throws if tampered. */
export function decryptSecret(payload: string): string {
  const key = loadKey();
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
