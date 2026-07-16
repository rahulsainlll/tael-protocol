# PR draft: TrustLine credit fallback in `runCapability()`

_Drafted by TrustLine against a local checkout of `main`
(`rahulsainlll/tael-protocol`), branch `trustline-credit-fallback`. Not yet
opened as a real PR — sharing as a concrete patch to discuss, not a fait
accompli._

## What this does

Today, `runCapability()`
(`apps/dashboard/features/agents/run-capability.ts`) fails a call outright if
the agent wallet's USDC balance can't cover the price:

```
Not enough USDC. This agent has $0, the call costs $0.05. Fund it first.
```

This patch inserts one fallback, in the one place it can correctly happen —
**before the payment is signed** — and only for wallets that already have a
live TrustLine credit line:

```
usdc < total?
  → ask TrustLine: does this wallet have >= shortfall in available credit?
    yes → borrow the shortfall into the wallet's own balance, then proceed as before
    no  → same "Not enough USDC… Fund it first" error as today
```

Everything after that point (steps 4–5: sign, retry with `X-PAYMENT`) is
**completely unchanged** — the wallet just has more USDC than it did a moment
ago, from its own borrow, signed the normal way.

## Why here, and not a `PaymentVerifier`

We first explored a standalone `PaymentVerifier` implementation (swap in a
credit-aware verifier, zero changes to `run-capability.ts`). That doesn't
actually work: a `PaymentVerifier.verify()` only ever receives an
**already-signed transaction** from the payer. There's no way to retroactively
enlarge a signed payment if it falls short — the signature is already fixed.
And TrustLine's `lending_vault.borrow()` intentionally pays credit **into the
borrowing wallet's own balance**, never to a third party, so it can't be used
to "top up" a payment after the fact without bypassing that wallet's own
signing authority.

The credit draw has to happen before signing, on the same wallet that's about
to sign — which is exactly what `runCapability()` already orchestrates in one
place. This patch is the correct (and only correct) integration point.

## What's added

- `tryDrawTrustLineCredit()` — a small helper that, given the agent's row
  (address + encrypted secret) and a shortfall amount:
  1. Skips entirely if `TRUSTLINE_API` isn't configured (default: unset).
  2. Constructs a `TrustLineAgent` from the same decrypted secret already used
     to sign payments a few lines below.
  3. Checks `availableCreditUsdc()` — the wallet's live, on-chain credit
     line. If it doesn't cover the shortfall, returns `false`.
  4. If it does, calls `borrow(shortfall)` — a write, signed by the wallet's
     own key, same as any other agent action — then returns `true`.
- One `TRUSTLINE_API` env var (unset = feature is off, byte-for-byte identical
  behavior to today).
- `@trustline-agents/agent-sdk` added as a dependency of `apps/dashboard`.

## What's deliberately NOT added

- **No automatic registration/underwriting.** If a wallet has never run
  `register()`/`underwrite()` against TrustLine, `availableCreditUsdc()` will
  just read as 0 (or the call will no-op/fail) and the fallback quietly does
  nothing — same as today. Getting a credit line is a decision the wallet
  owner should take deliberately (e.g. from the wallet page, once/if that UI
  ships), never something a single paid call triggers as a side effect.
- **No UI.** This is the server-action mechanism only. A credit-line widget on
  the wallet page (showing limit/used/available, maybe a manual "enable
  credit" toggle) is a separate, follow-on piece — see the phased plan in
  TrustLine's partnership brief.
- **No change to the spending-policy checks above it** (`maxPerCall`,
  `dailyLimit`) — those still run first and can still block a call outright;
  the credit draw only ever covers a *balance* shortfall within limits
  already approved.

## Failure behavior

Every failure mode in the new code path (`TRUSTLINE_API` unset, no credit
line, insufficient limit, RPC error, TrustLine backend down) resolves to
`tryDrawTrustLineCredit()` returning `false`, and `runCapability()` falling
straight through to the exact same "Not enough USDC" error it returns today.
**This patch cannot make a call fail that would have succeeded before it.**

## Verification status

Upgraded to pnpm 11 and re-verified for real against this checkout (branch
`trustline-credit-fallback`):

- ✅ `pnpm install` — clean, all 13 workspace projects resolved.
  `@trustline-agents/agent-sdk` was pointed at a local `link:` to our
  `packages/agent-sdk` build for this check, since the fix this patch depends
  on (Tael-compatible `payWithCredit`, see the SDK's own changes) is ahead of
  the currently-published `0.1.1` on npm. **Before merging this for real,
  swap `link:../../../packages/agent-sdk` back to a version range once we've
  published the `0.2.0` release** — that's a real, small prerequisite, not
  done yet.
- ✅ `pnpm typecheck` (`tsc --noEmit`) in `apps/dashboard` — passes clean.
  (Caught and fixed one real issue along the way: passing the whole `agent`
  row into `tryDrawTrustLineCredit` didn't preserve the `secretEnc !== null`
  narrowing from the guard above it; fixed by narrowing `secretEnc` into its
  own local and passing that through instead of the object.)
- ✅ `pnpm --filter @tael/payments --filter @tael/stellar test` — all 27
  existing tests still pass (this patch doesn't touch either package, but
  they're load-bearing dependencies of the changed code).
- ✅ `pnpm build` (full monorepo, via turbo) — **8/8 tasks succeed**,
  including a real Next.js production build of `apps/dashboard` with this
  patch in place.
- ❌ Still not run against a live dashboard end-to-end (no Postgres/env
  configured for this checkout, so no real capability call was exercised
  through this modified code path with a real TrustLine-registered wallet).
  That's the one thing left to prove before merging.

## Files changed

- `apps/dashboard/features/agents/run-capability.ts`
- `apps/dashboard/package.json` (added `@trustline-agents/agent-sdk`)
