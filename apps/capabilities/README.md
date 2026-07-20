# Tael first-party capabilities

A small service of useful, **Stellar-native** endpoints that Tael builds, hosts,
and publishes to the marketplace. These seed the marketplace with real, verified
tools that any agent can use on day one, and they dogfood the SDK publish flow.

## What lives here

Each endpoint is published as an operation of a Tael capability. Today:

| Capability | Operation                         | What it does                                                |
| ---------- | --------------------------------- | ----------------------------------------------------------- |
| Stellar    | `GET /stellar/balance?address=G…` | Balances (XLM + assets) for an account                      |
| Stellar    | `GET /stellar/account?address=G…` | Account details: sequence, signers, home domain, trustlines |
| Stellar    | `GET /stellar/tx?hash=…`          | A settled transaction by its hash                           |

All read-only, all public, all free.

## The rules (what belongs here)

A first-party capability must:

1. **Be Stellar-native and genuinely useful to an agent.** On-chain reads,
   quotes, account/asset lookups. If it isn't about Stellar, it doesn't belong
   here. Keep the surface focused.
2. **Be read-only or otherwise safe.** No destructive or state-changing action
   without an explicit, well-understood design. These run unauthenticated behind
   Tael's payment gate, so they must be safe to call.
3. **Need no secrets.** Everything here talks to public infrastructure (Horizon).
   If an endpoint needs an API key, it is a third-party capability, not a
   first-party one.
4. **Return clean, documented JSON.** Small, stable shapes. Include a
   `sampleRequest` and `sampleResponse` in the publish manifest.
5. **Be listed in the table above and in `src/publish.ts`.** The manifest in
   `publish.ts` is the source of truth for what is published.
6. **Price at 0 unless there is a real per-call cost.** First-party utilities are
   free to seed the marketplace; Tael earns on the marketplace fee of other
   capabilities, not on these.

## How to add one

1. Add the handler in `src/server.ts` (and a helper in `src/stellar.ts` if it
   reads the chain).
2. Add its operation to the `Stellar` manifest in `src/publish.ts` (name,
   path, method, price, sample request/response).
3. `pnpm --filter capabilities typecheck` and run it locally (`pnpm dev`).
4. Deploy, then publish (below).

## Deploy and publish

**1. Deploy this service.** On Render, create a new Web Service from the repo with:

| Setting       | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Build command | `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter capabilities build` |
| Start command | `pnpm --filter capabilities start`                                                                   |
| Environment   | `STELLAR_HORIZON_URL` (optional, defaults to testnet). `PORT` is injected.                           |

It binds `$PORT` and exposes `/health`, `/stellar/balance`, `/stellar/account`, `/stellar/tx`.

**2. Publish the capabilities to Tael** with the SDK, pointing at the deployed URL:

```bash
TAEL_KEY=tael_live_… \
PAY_TO=G… \
CAPABILITIES_URL=https://<your-render-service>.onrender.com \
  pnpm --filter capabilities publish:capabilities
```

This creates the `stellar` capability (operations `stellar/balance`, `stellar/account`,
`stellar/tx`). They go live as `pending`; a Tael admin grants Verified from the marketplace.
An agent then calls them with one key: `await tael.get("stellar/balance", { query: { address } })`.

## Want a capability that isn't here?

Open an issue labelled `good-first-capability` describing the Stellar tool you
want. Contributors can build it here and we publish it. This is how the
first-party surface grows.
