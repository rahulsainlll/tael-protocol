import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { generateKeypair } from "./keypair";

describe("generateKeypair", () => {
  it("returns a valid, matching public key and secret", () => {
    const { publicKey, secret } = generateKeypair();
    expect(publicKey).toMatch(/^G[A-Z2-7]{55}$/);
    expect(secret).toMatch(/^S[A-Z2-7]{55}$/);
    // The secret must derive the same public key.
    expect(Keypair.fromSecret(secret).publicKey()).toBe(publicKey);
  });

  it("generates a different keypair each call", () => {
    expect(generateKeypair().publicKey).not.toBe(generateKeypair().publicKey);
  });
});
