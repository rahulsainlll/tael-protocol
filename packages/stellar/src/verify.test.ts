import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { verifySignedMessage } from "./verify";

const MESSAGE = "Sign in to Tael\n\nNonce: abc123";

describe("verifySignedMessage", () => {
  it("accepts a signature from the matching account", () => {
    const keypair = Keypair.random();
    const signature = keypair.sign(Buffer.from(MESSAGE, "utf8")).toString("base64");
    expect(verifySignedMessage(keypair.publicKey(), MESSAGE, signature)).toBe(true);
  });

  it("rejects a signature from a different account", () => {
    const signer = Keypair.random();
    const claimed = Keypair.random();
    const signature = signer.sign(Buffer.from(MESSAGE, "utf8")).toString("base64");
    expect(verifySignedMessage(claimed.publicKey(), MESSAGE, signature)).toBe(false);
  });

  it("rejects a tampered message", () => {
    const keypair = Keypair.random();
    const signature = keypair.sign(Buffer.from(MESSAGE, "utf8")).toString("base64");
    expect(verifySignedMessage(keypair.publicKey(), `${MESSAGE} tampered`, signature)).toBe(false);
  });

  it("returns false for malformed input", () => {
    expect(verifySignedMessage("not-an-address", MESSAGE, "not-base64")).toBe(false);
  });
});
