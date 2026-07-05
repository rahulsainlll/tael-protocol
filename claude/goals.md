# Goals

## Mission

Build the **payment layer for autonomous AI agents** — so software can pay software. Just as Stripe
became the payment infrastructure for online businesses, Tael is the payment infrastructure for AI
agents.

## The problem

AI agents can reason, plan, code, and browse — but they can't **pay** for the services they need.
Every paid API assumes a human: credit cards, accounts, API keys, subscriptions, manual purchasing.
So agents stop and wait for a human, and developers must build billing infrastructure (accounts,
Stripe, usage tracking, invoicing) just to get paid.

## The solution

A machine-native payment protocol. Instead of subscriptions, agents **pay per request**:

```
Agent calls a tool → HTTP 402 Payment Required → agent signs payment
→ USDC settles on Stellar → tool executes → response returned
```

- **For developers:** wrap any API with one SDK call and get paid every time it's used — no billing,
  no Stripe, no accounts, no invoices.
- **For agents:** discover capabilities and pay automatically within user-defined spending policies,
  with no human in the loop.

## Target users

1. **Developers** publishing capabilities (APIs, MCP servers, agents, datasets) to monetize them.
2. **Users** funding agent wallets and setting spending policies.
3. **AI agents** autonomously purchasing capabilities.
4. **Organizations** managing teams, shared wallets, and billing.

## Why USDC on Stellar

Tael depends on extremely cheap, fast payments: near-zero fees, fast finality, native USDC, and
sponsored transactions (agents never need to hold XLM — they only spend USDC). Micropayment economics
that a credit-card rail can't match.

## Non-negotiables

- **Non-custodial.** Funds move directly agent wallet → developer wallet. Tael never holds funds.
- **Policy-bound.** Each agent gets a scoped signer that cannot exceed its on-chain spending policy,
  even if compromised.
- **Machine-native.** Instant settlement, micropayments, programmable limits — designed for software,
  not humans.

## Success criteria — the five end-to-end flows

The product is compelling once these work end to end:

1. Fund a wallet with USDC.
2. Publish a capability (API / MCP / Agent).
3. Browse the marketplace.
4. Let an AI agent pay for a capability.
5. Show the payment and revenue in real time.
