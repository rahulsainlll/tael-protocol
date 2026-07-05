# @tael/auth

**Sign-In-With-Stellar** authentication primitives — the wallet is the identity.

- `createChallenge(address, secret)` → `{ message, challengeToken }` — the message a wallet signs.
- `verifyChallengeToken(token, secret)` — recover the address + message on verify (stateless replay
  protection, no server store).
- `createSessionToken(address, secret)` / `verifySessionToken(token, secret)` — mint/verify the
  session JWT stored in an httpOnly cookie.

## Boundaries

- **jose-only and edge-safe.** No Stellar SDK here, so `verifySessionToken` can run inside Next.js
  middleware (edge runtime).
- **Signature verification is not here.** Verifying that a wallet actually signed the challenge uses
  `stellar-sdk` and lives in [`@tael/stellar`](../stellar) (`verifySignedMessage`); the app's
  `/api/auth/verify` route composes the two.

> `secret` should be a high-entropy string (≥ 32 chars) from `AUTH_SECRET`.
