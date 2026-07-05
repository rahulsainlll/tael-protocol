# Product spec

## Dashboard

The dashboard (`dashboard.tael.com`) is the heart of the product. Sections:

```
Overview        — wallet balance, spend, revenue, active agents, recent activity
Wallet          — balance, deposit, withdraw, spending policies, limits, sessions
Marketplace     — discover & buy capabilities (see below)
My Capabilities — publish & manage capabilities you sell
My Agents       — create agents, fund them, scope their spending
Analytics       — calls, success rate, latency, errors, revenue
Payments        — incoming / outgoing settlements, history
Reviews         — ratings, trust scores agents leave
Organizations   — teams, members, shared wallets
API Keys        — programmatic access
Settings        — profile, appearance, notifications, passkeys
```

The section list is driven from a single nav config (`apps/dashboard/features/navigation/nav.config.ts`).

## Marketplace — the differentiator

Everything is a **capability** — not just APIs. Like Hugging Face, but for things agents can buy and
pay for per call.

**Capability model**

```
Name · Description · Creator · Price (USDC/call) · Rating ★ · Success rate ·
Latency · Category · Revenue · Compatible agents
```

**Categories:** API · MCP · Agent · Workflow · Dataset · Browser · OCR · Model · Search

## Core user flows

**User**

1. Create an agent wallet.
2. Fund it with USDC.
3. Set spending rules (max per call, daily budget, allowed categories, blocked merchants).
4. Ask the agent to do a task.
5. Receive results + a spending summary (e.g. `Spent $0.71 · Remaining $19.29`).

**Developer**

1. Connect an API (`export default tael({ price: "0.02", handler: myApi })`).
2. Set pricing.
3. Add a Stellar wallet.
4. Publish.

Every successful request instantly pays the developer's wallet — no subscriptions, no payouts, no
waiting.

## Spending policy (example)

```
Max per call:  $0.50
Daily budget:  $5.00
Allowed:       ✓ Research  ✓ Data  ✓ OCR
Blocked:       ✗ Gambling  ✗ Unknown merchants
```

Enforced off-chain today; designed to map onto an on-chain policy contract so a compromised agent
still cannot exceed its limits.

## Domain entities

Users · Wallets · Capabilities · Agents · Payments · Transactions · Policies · Reviews ·
Organizations · Sessions. (Shared shapes live in `@tael/types`; persistence lands in
`@tael/database` in Phase 3.)
