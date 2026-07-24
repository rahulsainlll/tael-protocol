# Deploying Tael

Tael deploys on **Vercel** (the Next.js apps), with Vercel's Git integration as continuous
deployment: every push to the production branch deploys, and every PR gets a preview URL.

**No custom domain required** — Vercel provides free `*.vercel.app` subdomains. Add a real domain
later (see [Custom domain](#custom-domain-later)).

Repo: `github.com/tael-protocol/tael`.

---

## 1. Marketing site (`apps/web`) — do this first

On [vercel.com](https://vercel.com) (sign in with GitHub):

1. **Add New → Project** → import `tael-protocol/tael`.
2. **Root Directory:** `apps/web` ← the one setting that matters for a monorepo.
3. **Framework Preset:** Next.js (auto-detected).
4. Leave **Build** and **Install** commands as default — Vercel detects the pnpm workspace and installs
   from the repo root; `next build` runs in `apps/web`. Node 22 is picked up from `engines.node`.
5. **Environment Variables** (optional for the marketing site):
   - `NEXT_PUBLIC_API_URL` — the API URL (once deployed)
   - `NEXT_PUBLIC_APP_URL` — the dashboard URL (once deployed)
6. **Deploy.** Name the project `tael` to get `https://tael.vercel.app`.

Every future push to the production branch redeploys automatically. That's the whole CD pipeline —
combined with the GitHub Actions in `.github/workflows/ci.yml` (lint/typecheck/test/build on PRs).

---

## 2. Dashboard (`apps/dashboard`) — when ready

Same flow, a **separate** Vercel project:

- **Root Directory:** `apps/dashboard`
- **Env:** `NEXT_PUBLIC_API_URL`; auth vars once `@tael/auth` lands.
- Suggested name: `tael-app` → `https://tael-app.vercel.app`.

---

## 3. API (`apps/api`) — when ready

The API is a Hono/Node server, not a Next app, so it doesn't use Vercel's Next preset. Two options:

- **Railway / Render (recommended):** new service from the repo →
  build `pnpm --filter @tael/api build`, start `node apps/api/dist/index.js`. Set env from
  `.env.example`.
- **Vercel Functions:** wrap the Hono app with the `hono/vercel` adapter and deploy as a function.

Then set the deployed API URL as `NEXT_PUBLIC_API_URL` in the web + dashboard projects.

---

## Production branch

The scaffold currently lives on `scaffold/monorepo-foundation`. Pick one:

- **Open a PR into `main`** (CI runs), merge, and set Vercel's Production Branch to `main` — the clean
  long-term flow.
- Or, to see it live immediately, set the Vercel project's **Production Branch** to
  `scaffold/monorepo-foundation`.

---

## Custom domain (later)

When you buy a domain, add it per project in **Settings → Domains**, e.g.
`tael.com` → web, `app.tael.com` → dashboard, `api.tael.com` → API.
