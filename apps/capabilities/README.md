# Tael first-party capabilities

A small service of useful endpoints that Tael builds, hosts, and publishes to the
marketplace. These seed the marketplace with real, verified tools that any agent
can use on day one, and they dogfood the SDK publish flow.

## What lives here

Each capability is a self-contained folder under `src/capabilities/`. Today:

| Capability | Operation                         | What it does                                                |
| ---------- | --------------------------------- | ----------------------------------------------------------- |
| Stellar    | `GET /stellar/balance?address=G…` | Balances (XLM + assets) for an account                      |
| Stellar    | `GET /stellar/account?address=G…` | Account details: sequence, signers, home domain, trustlines |
| Stellar    | `GET /stellar/tx?hash=…`          | A settled transaction by its hash                           |
| Stellar    | `GET /stellar/status`             | Latest ledger, protocol version, base fee and reserve       |
| Stellar    | `GET /stellar/orderbook?…`        | Top bids/asks for a DEX pair                                |
| FX Rates   | `GET /fx/rates?base=USD`          | Reference fiat exchange rates (non-Stellar utility)         |

All read-only, all public, all free.

## Structure

A capability is one folder (one marketplace card). Each of its operations is one
file under `operations/`.

```
src/
  index.ts              boot (binds $PORT)
  server.ts             thin: /health + mounts every capability's routes
  publish.ts            thin: upserts every capability's manifest
  assemble.ts           builds { routes, manifest } from meta + operations
  types.ts              CapabilityMeta, Operation, CapabilityModule
  registry.generated.ts collected capabilities (generated, git-ignored)
  capabilities/
    stellar/
      capability.ts     metadata: name "Stellar", kind, description, faqs
      operations/
        balance.ts      one file per operation: manifest fields + handler
        account.ts
        tx.ts
        status.ts
        orderbook.ts
      horizon.ts        shared helpers for its operations
    fx/
      capability.ts
      operations/
        rates.ts
      rates.ts          helper
scripts/
  gen-registry.mjs      scans capabilities/* → writes registry.generated.ts
```

`server.ts` and `publish.ts` never grow: they loop over the registry, which is
regenerated before every dev / build / typecheck / publish. Because both
capabilities **and** operations are auto-collected:

- **adding an operation** to a capability = one new file in its `operations/`
- **adding a capability** = one new folder with a `capability.ts`

Either way you touch only your own new file, so PRs never conflict with each other.

## The rules (what belongs here)

A first-party capability must:

1. **Be genuinely useful to an agent, and self-contained.** Stellar reads are the
   heart of it (quotes, account/asset lookups), but any capability that runs on
   public data or pure compute with **no secret** is welcome (e.g. FX rates,
   address validation). If it needs an API key, it is a third-party capability
   (published via the SDK from its own repo), not a first-party one.
2. **Be read-only or otherwise safe.** No destructive or state-changing action
   without an explicit, well-understood design. These run unauthenticated behind
   Tael's payment gate, so they must be safe to call.
3. **Need no secrets.** Everything here talks to public infrastructure. Anything
   requiring a key belongs in a publisher's own repo (Tael encrypts upstream
   secrets there).
4. **Return clean, documented JSON.** Small, stable shapes. Include a
   `sampleRequest` and `sampleResponse` in the manifest.
5. **Price at 0 unless there is a real per-call cost.** First-party utilities are
   free to seed the marketplace.

## How to add an operation (most common)

Adding an operation to an existing capability, e.g. `/stellar/asset` under
Stellar. Copy an operation file as your template:

1. `cp src/capabilities/stellar/operations/status.ts src/capabilities/stellar/operations/asset.ts`
2. Edit `asset.ts` — set `name`, `path`, `price: "0"`, `sampleRequest`,
   `sampleResponse`, and the `handler`. Put any fetch logic in the capability's
   helper (`stellar/horizon.ts`).
3. That's it. The registry picks the file up automatically, nothing else to edit.
   Run `pnpm --filter capabilities typecheck` and `pnpm --filter capabilities dev`,
   then `curl "localhost:3004/stellar/asset?code=USDC&issuer=G…"`.
4. Open a PR (`Closes #<issue>`). Because it's a new file, it can't conflict with
   anyone else's operation.

## How to add a new capability

A new domain (a new marketplace card), e.g. `fx`:

1. `mkdir -p src/capabilities/<name>/operations`
2. Add `capability.ts` — `export const meta: CapabilityMeta = { name, kind,
description, faqs }`.
3. Add one file per operation under `operations/` (see above), plus any helpers.
4. The registry picks up the folder automatically. Typecheck, run locally, open a PR.

Both flows are checked by CI, and a maintainer publishes after merge (below).

## Deploy and publish

**1. Deploy this service.** On Render, create a new Web Service from the repo with:

| Setting       | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Build command | `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter capabilities build` |
| Start command | `pnpm --filter capabilities start`                                                                   |
| Environment   | `STELLAR_HORIZON_URL` (optional, defaults to testnet). `PORT` is injected.                           |

**2. Publish the capabilities to Tael** with the SDK, pointing at the deployed URL:

```bash
TAEL_KEY=tael_live_… \
PAY_TO=G… \
CAPABILITIES_URL=https://<your-render-service>.onrender.com \
  pnpm --filter capabilities publish:capabilities
```

This upserts every capability in the registry (create on first run, update in
place after). They go live as `pending`; a Tael admin grants Verified from the
marketplace. An agent then calls them with one key:
`await tael.get("stellar/balance", { query: { address } })`.

## Want a capability that isn't here?

Open an issue labelled `good-first-capability` describing the tool you want.
Contributors build it in its own folder and we publish it. This is how the
first-party surface grows.
