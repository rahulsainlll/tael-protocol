# TrustLine × Tael — the short version

A plain-English overview of what we've built with you and why. The full
technical detail (exact diffs, file paths, test steps) lives in
`TRUSTLINE_INTEGRATION.md` — this doc is just the story.

## The one-line idea

Tael lets an agent get paid. TrustLine lets an agent **spend on credit when its
wallet is short** — and turns the money it earns on Tael into a credit line.

## What breaks today, and what we fix

Right now, if an agent tries to call a capability it can't afford, Tael stops
it: *"Not enough USDC. Fund it first."* The agent stalls until a human tops it
up. For an autonomous agent, that's a dead end.

With TrustLine, that same agent can **borrow the shortfall on the spot**, pay,
and keep going — then repay later out of what it earns. Nothing else about the
call changes.

## Two things we added to Tael

**1. Agents can pay on credit.**
When an agent is short on USDC, it can draw the difference from a TrustLine
credit line instead of failing. This only ever happens when the agent's owner
has explicitly turned it on (a per-agent toggle) — so nothing borrows money by
surprise. If it's off, or the agent has no credit line, everything behaves
exactly as it does today.

**2. "Credit" is now a capability people can list.**
We added a new capability type — **Credit** — that shows up in the marketplace
like any other listing (its own badge and everything). Calling it answers "how
much can this agent borrow right now?" It's a normal paid call that flows
through Tael's gateway, so **Tael sees it and earns its marketplace fee on it,
just like every other capability.**

## How each side earns

- **Tael** keeps its marketplace fee on every call, including the new credit
  checks — nothing routes around you.
- **TrustLine** earns a small fee (planned at ~$0.10) each time an agent checks
  its credit through the marketplace listing, paid to a TrustLine wallet
  through Tael's normal settlement. Longer term, TrustLine earns from interest
  when agents actually borrow and repay.
- **The agent's owner** gets an agent that never stalls for lack of funds, and
  a credit line that grows as the agent earns and repays reliably.

The nice part: the money never leaves the Tael + TrustLine loop. An agent earns
on Tael → that income makes it creditworthy on TrustLine → it borrows to spend
more on Tael → repays from Tael earnings → its limit grows.

## What we need from you

1. **Publish a "Credit" capability** pointing at TrustLine's read endpoint, with
   the payout going to a TrustLine wallet. (Exact values in
   `TRUSTLINE_INTEGRATION.md`.)
2. **Show the credit toggle** in the agent settings, so owners can opt an agent
   into borrowing.
3. **One dependency note:** the agent side needs TrustLine's SDK at version
   `0.2.0` (an earlier version builds the wrong kind of payment for your
   settlement — details in the technical doc). Just make sure that version is
   the one installed.

## How to try it

There's a full step-by-step in `TRUSTLINE_INTEGRATION.md` (Part 3): give a test
agent a credit line, flip its toggle on, run a call it can't afford, and watch
it borrow-then-pay instead of failing. Everything's already been run end to end
on Stellar testnet on our side — the guide walks you through reproducing it.

## Where to reach us

TrustLine: https://github.com/TechnicallyKiller/TrustLine
Happy to hop on a call and walk through any of it — or pair on getting it merged.
