import { describe, expect, it } from "vitest";
import { TaelError } from "@tael/types";
import { createChallenge, verifyChallengeToken } from "./challenge";
import { createSessionToken, verifySessionToken } from "./session";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const OTHER_SECRET = "a-different-secret-that-is-also-long-enough-000";
const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

describe("session tokens", () => {
  it("round-trips an address", async () => {
    const token = await createSessionToken(ADDRESS, SECRET);
    expect((await verifySessionToken(token, SECRET)).address).toBe(ADDRESS);
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken(ADDRESS, SECRET);
    await expect(verifySessionToken(`${token}x`, SECRET)).rejects.toBeInstanceOf(TaelError);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(ADDRESS, SECRET);
    await expect(verifySessionToken(token, OTHER_SECRET)).rejects.toBeInstanceOf(TaelError);
  });
});

describe("challenge", () => {
  it("issues a message and verifies its token", async () => {
    const { message, challengeToken } = await createChallenge(ADDRESS, SECRET);
    expect(message).toContain(ADDRESS);

    const recovered = await verifyChallengeToken(challengeToken, SECRET);
    expect(recovered.address).toBe(ADDRESS);
    expect(recovered.message).toBe(message);
  });

  it("rejects a challenge token with the wrong secret", async () => {
    const { challengeToken } = await createChallenge(ADDRESS, SECRET);
    await expect(verifyChallengeToken(challengeToken, OTHER_SECRET)).rejects.toBeInstanceOf(
      TaelError,
    );
  });
});
