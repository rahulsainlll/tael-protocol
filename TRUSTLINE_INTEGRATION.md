# TrustLine × Tael — Integration Guide

_Drop this file into the repo, follow it top to bottom. Everything it
describes is either already staged as a patch against this checkout
(branch `trustline-credit-fallback`) or a copy-pasteable code change. Written
so it can be reviewed and merged without any back-and-forth to understand
intent — the "why" is inline at every step._

## What this adds, in one sentence

An agent whose USDC balance can't cover a capability's price draws the
shortfall from a TrustLine credit line — instead of failing with "Fund it
first" — **if and only if** that wallet already has a live TrustLine credit
line; every other wallet behaves exactly as today, byte-for-byte.

Plus: a `credit` capability kind, so "check what an agent can borrow" is a
normal, discoverable, per-call-priced marketplace listing like any other API.

## Prerequisite: publish status of `@trustline-agents/agent-sdk`

The fix this integration depends on — `payWithCredit()` correctly building
**classic** `Operation.payment` transactions with Tael's `tael` memo, instead
of only the Soroban-SAC-style payment `@x402/stellar`'s generic scheme
builds — lands in `@trustline-agents/agent-sdk@0.2.0`. **As of this writing,
npm's latest published version is `0.1.1`.** Two options:

- **Wait for `0.2.0` to publish**, then use a normal semver range
  (`"@trustline-agents/agent-sdk": "^0.2.0"`).
- **Use it now via a git dependency**, pointing at the TrustLine repo directly:
  `"@trustline-agents/agent-sdk": "github:TechnicallyKiller/TrustLine#main&path:/packages/agent-sdk"`
  (adjust the ref/path syntax to whatever your package manager's git-dep
  syntax requires — this repo uses pnpm, which supports this form).

Everything below assumes the dependency resolves to `0.2.0` or later. If you
try this against `0.1.1`, the credit-draw fallback will still run, but the
subsequent payment attempt will fail — `payWithCredit` in `0.1.1` builds the
wrong transaction shape for Tael's verifier. This is not a Tael-side bug if it
happens; it means the dependency is still pinned to `0.1.1`.

---

## Part 1 — the credit-draw fallback (`runCapability`)

### Where

`apps/dashboard/features/agents/run-capability.ts` — the balance check at
what's currently step 3b (`fetchUsdcBalance` → compare to `total`).

### The change

```diff
--- a/apps/dashboard/features/agents/run-capability.ts
+++ b/apps/dashboard/features/agents/run-capability.ts
@@
 const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
 const STELLAR_NETWORK = process.env.STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
+// TrustLine underwriting API — https://github.com/TechnicallyKiller/TrustLine.
+// Unset (default) means no wallet has a credit line to draw against; the
+// balance check below then behaves exactly as it did before this change.
+const TRUSTLINE_API = process.env.TRUSTLINE_API;
 const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

 interface Requirement {
@@
 export interface RunResult {
   ok: boolean;
   status?: number;
   body?: string;
   paid?: string;
   error?: string;
 }

+/**
+ * Draw `shortfallUsdc` of TrustLine credit into this agent's own wallet, if
+ * (and only if) the agent already has a live TrustLine credit line — never
+ * registers or underwrites one on the fly, since that's a deliberate decision
+ * the wallet owner should take (see the SDK's `onboard()`), not something a
+ * single paid call should trigger implicitly. Best-effort: any failure
+ * (no TRUSTLINE_API configured, no credit line, insufficient limit, RPC error)
+ * just returns `false` and the caller falls through to the existing
+ * "not enough USDC" error — this can never make a call fail that would have
+ * succeeded anyway.
+ */
+async function tryDrawTrustLineCredit(secretEnc: string, shortfallUsdc: string): Promise<boolean> {
+  if (!TRUSTLINE_API) return false;
+  try {
+    const { TrustLineAgent } = await import("@trustline-agents/agent-sdk");
+    const tl = new TrustLineAgent(decryptSecret(secretEnc), { apiBaseUrl: TRUSTLINE_API });
+    const available = await tl.availableCreditUsdc();
+    if (available < Number(shortfallUsdc)) return false;
+    await tl.borrow(Number(shortfallUsdc));
+    return true;
+  } catch (error) {
+    console.error("[run] TrustLine credit draw failed (falling back to balance error):", error);
+    return false;
+  }
+}
+
 /** Sum the total (amount + fee) this wallet paid in the last 24h, from the ledger. */
 async function spentLast24h(payer: string): Promise<Money> {
@@
   if (!agent?.secretEnc) return { ok: false, error: "Agent wallet not found." };
+  // Narrow secretEnc to `string` once, here — `agent.secretEnc` on its own
+  // narrows fine after the guard above, but passing the whole `agent` object
+  // into a helper typed against a stricter shape does not carry that
+  // narrowing through, so tryDrawTrustLineCredit takes `secretEnc` explicitly.
+  const secretEnc = agent.secretEnc;
@@
-  // 3b. Make sure the wallet actually holds enough USDC (clear error, not a 500).
-  const { usdc } = await fetchUsdcBalance(agent.address);
+  // 3b. Make sure the wallet actually holds enough USDC. If it's short, and the
+  // owner has opted THIS agent into credit (policy.allowCreditDraw), try a
+  // TrustLine credit draw before failing. Two gates, both off by default: the
+  // TRUSTLINE_API env var (deployment-wide) AND the per-agent policy flag.
+  // Any opt-out / no-credit-line / failure just sees the same shortfall and
+  // error as today — never blocks a call that would otherwise have failed.
+  let { usdc } = await fetchUsdcBalance(agent.address);
+  if (
+    agent.policy?.allowCreditDraw &&
+    Money.parse(total.toDecimalString()).isGreaterThan(Money.parse(usdc))
+  ) {
+    const shortfall = total.subtract(Money.parse(usdc));
+    const drew = await tryDrawTrustLineCredit(secretEnc, shortfall.toDecimalString());
+    if (drew) {
+      usdc = (await fetchUsdcBalance(agent.address)).usdc;
+    }
+  }
   if (Money.parse(total.toDecimalString()).isGreaterThan(Money.parse(usdc))) {
     return {
       ok: false,
       error: `Not enough USDC. This agent has $${usdc}, the call costs $${total.toDecimalString()}. Fund it first.`,
     };
   }
```

### Dependency

```diff
--- a/apps/dashboard/package.json
+++ b/apps/dashboard/package.json
@@
     "@tael/ui": "workspace:*",
+    "@trustline-agents/agent-sdk": "^0.2.0",
     "lucide-react": "catalog:",
```

(See the prerequisite note above if `0.2.0` isn't published yet when you do this.)

### Why here, and not a `PaymentVerifier`

We first explored a standalone `PaymentVerifier` — zero changes to
`run-capability.ts`, just swap in a credit-aware verifier. **This doesn't
work.** A `PaymentVerifier.verify()` only ever receives an **already-signed
transaction** from the payer; there is no way to retroactively enlarge a
signed payment that falls short — the signature is fixed. And TrustLine's
`lending_vault.borrow()` intentionally pays credit **into the borrowing
wallet's own balance**, never to a third party, so it can't "top up" a payment
after the fact without bypassing that wallet's own signing authority. The
credit draw has to happen before signing, on the same wallet that's about to
sign — which is exactly what `runCapability()` already orchestrates in one
place. This is the correct integration point, not a workaround.

### Two off-by-default gates (both must be on for a draw to happen)

1. **`TRUSTLINE_API` env var** — deployment-wide. Unset ⇒ the whole feature is
   dormant.
2. **`policy.allowCreditDraw` per agent** — the wallet owner's explicit consent
   for _this specific agent_ to take on debt autonomously. This is a new
   optional boolean on the existing `SpendingPolicy` (`@tael/types`), absent
   (⇒ off) for every existing agent and DB row. Surface it in the agent's
   policy editor as a simple toggle ("Allow this agent to draw TrustLine credit
   when short"). Nothing auto-borrows until an owner turns it on.

```diff
--- a/packages/types/src/policy.ts
+++ b/packages/types/src/policy.ts
   blockedPublishers: z.array(z.string()).default([]),
+  /** Opt-in: allow drawing a TrustLine credit-line shortfall instead of
+   *  failing on insufficient balance. Absent/false ⇒ off (the default). */
+  allowCreditDraw: z.boolean().optional(),
 });
```

### What this does NOT do (by design)

- **No automatic registration/underwriting.** A wallet that's never run
  `register()`/`underwrite()` against TrustLine just has `availableCreditUsdc()`
  read as ~0, and the fallback quietly no-ops. Getting a credit line is a
  decision the wallet owner takes deliberately — see Part 3 for the manual
  bootstrap, and treat any future "enable credit" UI as a separate follow-on.
- **No auto-borrow without explicit per-agent consent** — see the
  `allowCreditDraw` gate above.
- **No change to spending-policy checks** (`maxPerCall`, `dailyLimit`) — those
  still run first and can still block a call outright. The credit draw only
  ever covers a _balance_ shortfall within limits already approved.
- **Never makes a working call fail.** Every failure mode in the new path
  (`TRUSTLINE_API` unset, `allowCreditDraw` off, no credit line, insufficient
  limit, RPC error, TrustLine backend down) resolves to `false`, falling
  through to the exact "Not enough USDC" error that exists today.

---

## Part 2 — `credit` capability kind

Lets "how much can this agent borrow right now" be listed and called like any
other capability — no gateway changes needed, because it's genuinely just a
cheap, metered API read (TrustLine's own backend), not a special case.

### Files changed

**`packages/database/src/schema/_shared.ts`** — add `"credit"` to the
Postgres enum:

```diff
 export const capabilityKind = pgEnum("capability_kind", [
   "api",
   "mcp",
   "agent",
   "model",
   "dataset",
+  "credit",
 ]);
```

**New migration** `packages/database/drizzle/0010_add_credit_capability_kind.sql`:

```sql
ALTER TYPE "capability_kind" ADD VALUE 'credit';
```

> After merging the schema change, re-run `pnpm --filter @tael/database
generate` so drizzle-kit produces a matching snapshot in
> `packages/database/drizzle/meta/` — this migration file was hand-written to
> match the existing enum-addition pattern (see `0006_public_peter_quill.sql`
> for precedent), not machine-generated, so double-check it against your own
> generator's output before applying to a real database.

**`apps/dashboard/features/marketplace/types.ts`**:

```diff
-export const capabilityKinds = ["api", "mcp", "agent", "model", "dataset"] as const;
+export const capabilityKinds = ["api", "mcp", "agent", "model", "dataset", "credit"] as const;
```

**`apps/dashboard/features/capabilities/kind-meta.ts`** — icon + badge color:

```diff
-import { Blocks, Bot, BrainCircuit, Braces, Database, type LucideIcon } from "lucide-react";
+import {
+  Blocks,
+  Bot,
+  BrainCircuit,
+  Braces,
+  Database,
+  Landmark,
+  type LucideIcon,
+} from "lucide-react";
```

```diff
   dataset: {
     icon: Database,
     label: "Dataset",
     badge: "bg-pink-500/10 text-pink-600 border-pink-500/20",
     tile: "bg-pink-500/10 text-pink-600",
   },
+  // TrustLine's kind: a metered read against an underwriting API, not a
+  // third-party proxy — see below for why this fits the existing
+  // per-call-price gateway model unmodified.
+  credit: {
+    icon: Landmark,
+    label: "Credit",
+    badge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
+    tile: "bg-teal-500/10 text-teal-600",
+  },
 };
```

**`apps/dashboard/features/capabilities/kind-fields.ts`** — publish-wizard
labels + sample request/response:

```diff
   dataset: {
     method: false,
     urlLabel: "Dataset endpoint",
     urlPlaceholder: "https://api.example.com/v1/prices",
     requestLabel: "Query example",
     requestPlaceholder: `{ "symbol": "AAPL", "range": "1d" }`,
     responseLabel: "Sample rows",
     responsePlaceholder: `[ { "date": "2026-07-12", "close": 231.4 } ]`,
   },
+  credit: {
+    method: true,
+    urlLabel: "Underwriting endpoint",
+    urlPlaceholder: "https://trustline.onrender.com/agent/:address/available-credit",
+    requestLabel: "Sample request",
+    requestPlaceholder: `GET /agent/GABC…XYZ/available-credit`,
+    responseLabel: "Sample response",
+    responsePlaceholder: `{ "agent": "GABC…XYZ", "rampedLimitUsdc": 12.5, "tier": 2, "aprBps": 850 }`,
+  },
 };
```

### Why this kind doesn't need any gateway changes

Every other kind's `upstreamUrl` is a _third party's_ service that
`gateway.handler.ts`'s `proxyToUpstream()` proxies to after payment. A
"credit" capability's upstream is **TrustLine's own read endpoint** — a
genuinely ordinary, cheap, metered HTTP GET, no different in shape from any
`api`-kind capability. So `describeCapabilitySchema`'s existing
`upstreamUrl: z.string().url()` requirement is satisfied honestly (it really
is a callable URL), and the gateway's proxy logic runs completely unmodified.

We deliberately did **not** go further and make "credit" a special
gateway-aware kind (e.g. one that calls a borrow/underwrite endpoint with
side effects). That would need `proxyToUpstream` to special-case this one
kind, defeating the point of a shared enum, and — separately — "check
available credit" (read) and "draw credit" (write, side-effecting) are
different trust levels; only the former belongs in a public marketplace
listing. Drawing credit happens in Part 1's fallback, gated by the wallet
owner's own key, not through a marketplace capability call.

### The upstream endpoint this capability lists

`GET https://trustline.onrender.com/agent/:address/available-credit` —
newly added to TrustLine's backend for this purpose. Cheap (reads a stored
result, no live chain call), returns:

```json
{ "agent": "GABC…XYZ", "rampedLimitUsdc": 12.5, "tier": 2, "aprBps": 850 }
```

`rampedLimitUsdc` is the agent's current ramped **ceiling** (what the vault
contract allows it to draw up to), not a live limit-minus-outstanding
figure — getting the precise "can borrow right now" number requires a live
vault read (what the SDK's own `availableCreditUsdc()` does). Treat this
capability's response as a discovery/estimate signal for marketplace
browsing, not the source of truth `runCapability`'s fallback itself relies on
(that fallback calls the SDK method directly, which does read live).

A wallet that's never been underwritten gets
`{ "rampedLimitUsdc": 0, "tier": 0, "aprBps": 0 }` — HTTP 200, not a 404 the
caller needs to branch on specially.

---

## Part 3 — testing this yourself, end to end

### 3.1 — Get a testnet wallet a real TrustLine credit line

The dashboard has no "enable credit" UI (see Part 1's scope notes) — bootstrap
one manually against the same wallet secret your agent already uses:

```bash
npm install @trustline-agents/agent-sdk   # once 0.2.0 is published; see prerequisite
```

```js
import { TrustLineAgent } from "@trustline-agents/agent-sdk";

const tl = new TrustLineAgent(YOUR_AGENT_WALLET_SECRET, {
  apiBaseUrl: "https://trustline.onrender.com",
});

await tl.onboard(); // register() + underwrite() in one call
console.log(await tl.creditLine()); // { tier, limitUsdc, aprBps }
console.log(await tl.availableCreditUsdc()); // what it can actually draw right now
```

This needs the wallet to have **some real, on-chain x402 revenue history**
already (TrustLine underwrites on real revenue, not a manual override) — the
easiest way to get that on testnet is to have the wallet receive a couple of
real Tael-settled payments first (any Tael capability, any amount), wait a
few minutes for indexing, then run the snippet above.

### 3.2 — Set the env var and run a capability call through a funded-short wallet

```bash
# apps/dashboard/.env (or your deployment's env)
TRUSTLINE_API=https://trustline.onrender.com
```

Then, from the dashboard UI: pick an agent whose wallet has **less USDC than
a capability's price** but **does** have available TrustLine credit (from
3.1), **and set that agent's `policy.allowCreditDraw` to true** (the per-agent
toggle — without it the draw won't fire even with everything else configured),
and click Run. Expected: the call succeeds — check your server logs for
`[run] TrustLine credit draw failed` (should NOT appear); check the agent
wallet's balance on Horizon before/after (should show a `borrow` transaction
landing new USDC just before the capability's own payment transaction).

### 3.3 — Confirm the fallback doesn't fire when it shouldn't

- Unset `TRUSTLINE_API` entirely → any underfunded call should fail with the
  exact same "Not enough USDC… Fund it first." message as before this change.
- `TRUSTLINE_API` set but the agent's `policy.allowCreditDraw` is false/absent
  → no draw attempted; same existing error. (This is the important one: proves
  a credit-capable wallet still won't borrow unless its owner opted in.)
- A wallet with both gates on but no credit line (never onboarded) → same
  result: falls straight through to the existing error.

### 3.4 — Try the `credit` capability listing

Publish a capability with these exact values through the normal publish wizard:

- **name**: `trustline-credit` (this is the private identifier your gateway
  attributes calls under — the same way every other capability's upstream is
  named/metered, so Tael sees "a call went through Tael to the trustline-credit
  upstream" and can bill/attribute it exactly like any `api` capability)
- **kind**: `credit`
- **upstreamUrl**: `https://trustline.onrender.com/agent/:address/available-credit`
  — swap `:address` for a real Stellar address at publish time (static
  per-listing URL like any other `api` capability; use one representative
  wallet, or template the path however your existing `api`-kind capabilities
  already handle path params)
- **upstreamSecret**: leave blank — TrustLine's read endpoint is public, no key
- **payTo**: a **TrustLine-controlled** Stellar wallet (not the querying agent's)
  — this is how TrustLine earns from the integration: each credit-check call
  settles its price to this wallet, minus Tael's marketplace fee, through Tael's
  normal gateway. Ask TrustLine for the current payout address.
- **price**: `$0.10` per check (a metering/access fee for the underwriting
  read — this is TrustLine's direct per-call revenue from Tael; the larger
  value is the credit line itself, drawn separately in Part 1). Adjust down if
  agents end up caching the result and this discourages calls.

This matters for Tael specifically: because the call routes through the gateway
to a named upstream, **Tael keeps full visibility and its marketplace fee on
every credit-check call**, exactly like any other capability — the `credit`
kind doesn't bypass Tael's accounting, it flows through it.

Confirm it lists correctly in `/marketplace` with the teal "Credit" badge, and
that calling it returns the JSON shape shown in Part 2.

---

## Questions / where to reach us

TrustLine repo: https://github.com/TechnicallyKiller/TrustLine
Full partnership context (why this integration exists, the revenue-underwriting
angle, what we still owe you): see `TAEL_PARTNERSHIP.md` in that repo, or ask
directly — happy to pair on getting this merged.
