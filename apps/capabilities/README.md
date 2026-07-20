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

All read-only, all public, all free.

## Structure

```
src/
  index.ts              boot (binds $PORT)
  server.ts             thin: /health + mounts every capability's routes
  publish.ts            thin: upserts every capability's manifest
  types.ts              the CapabilityModule shape
  registry.generated.ts collected capabilities (generated, git-ignored)
  capabilities/
    stellar/
      index.ts          exports { routes, manifest }
      routes.ts         Hono routes: /stellar/balance, /account, /tx
      manifest.ts       the marketplace manifest
      horizon.ts        its own helpers
scripts/
  gen-registry.mjs      scans capabilities/* → writes registry.generated.ts
```

`server.ts` and `publish.ts` never grow: they loop over the registry, which is
regenerated from the folders before every dev / build / typecheck / publish. So
**adding a capability touches only its own new folder** — no shared file to edit,
which means capability PRs can't conflict with each other.

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

## How to add one

Copy the `stellar/` folder as a template. To add, say, an `fx` capability:

1. `mkdir src/capabilities/fx` and add:
   - `routes.ts` — a Hono app with your routes (`export const routes`).
   - `manifest.ts` — the marketplace manifest (`export const manifest`), with a
     `sampleRequest` / `sampleResponse` per operation.
   - `index.ts` — `export const capability: CapabilityModule = { routes, manifest }`.
   - any helpers (e.g. `rates.ts`).
2. That's it. The registry picks it up automatically. Run
   `pnpm --filter capabilities typecheck` and `pnpm --filter capabilities dev`,
   then `curl localhost:3004/fx/rates`.
3. Open a PR. A maintainer merges, the service redeploys, and the publish step
   below makes it live.

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
