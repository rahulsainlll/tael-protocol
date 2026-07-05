/** Encode a string secret into the key material jose expects (HMAC / HS256). */
export function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}
