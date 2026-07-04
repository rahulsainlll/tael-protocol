<div align="center">

# Tael

### The payment layer for autonomous AI agents.

Let AI agents pay for APIs, MCP tools, data, and digital services using USDC on Stellar.

[Website](https://tael.xyz) • [Documentation](#) • [X](#)

</div>

---

## Overview

AI agents can reason, plan, write code, browse the web, and automate workflows.

But they still can't do one important thing:

> **Pay for the services they need.**

Every paid API requires a credit card, an account, API keys, billing logic, subscriptions, or manual purchasing.

Humans remain in the loop.

**Tael changes that.**

Tael is a programmable payment layer that enables autonomous AI agents to purchase APIs, MCP tools, datasets, and digital services using **USDC on Stellar**.

Developers wrap any API with one SDK command and instantly monetize it.

Agents discover tools, pay automatically within user-defined spending policies, and continue working without human intervention.

---

# Why Tael?

Today's AI ecosystem has three major problems.

### AI agents cannot buy capabilities

When an agent needs company data, OCR, translation, search, weather, PDFs, or another premium service, it stops.

Someone has to manually subscribe or provide credentials.

---

### Developers must build billing infrastructure

Every API developer has to manage:

- User accounts
- Authentication
- Billing
- Stripe integration
- Usage tracking
- Invoicing
- Payment failures

This creates significant engineering overhead.

---

### APIs are not designed for autonomous software

Traditional billing assumes a human customer.

AI agents need:

- machine-native payments
- instant settlement
- micropayments
- programmable spending limits

---

# Solution

Tael introduces a machine-native payment protocol.

Instead of subscriptions, agents simply pay per request.

```
Agent
   │
   ▼
Calls Tool
   │
   ▼
HTTP 402 Payment Required
   │
   ▼
Agent signs payment
   │
   ▼
USDC settles on Stellar
   │
   ▼
Tool executes
   │
   ▼
Response returned
```

Every request becomes:

```
Request
→ Payment
→ Verification
→ Execution
```

---

# Features

## For AI Agents

- Autonomous purchases
- Pay-per-call APIs
- Smart spending policies
- Passkey-secured wallets
- USDC only
- No gas tokens
- Micropayment support
- Automatic retries
- Transparent receipts

---

## For Developers

Wrap existing APIs in one command.

```ts
import { tael } from "@tael/sdk"

export default tael({
    price: "0.02",
    handler: myApi
})
```

That's it.

No billing.

No Stripe.

No customer accounts.

No invoices.

Just get paid every time your API is called.

---

## For MCP Servers

Existing MCP servers can be wrapped without modification.

```
Claude
    │
    ▼
Tael MCP Wrapper
    │
    ▼
Payment Verification
    │
    ▼
Existing MCP Server
```

---

# User Experience

## User

1. Create an agent wallet
2. Fund it with USDC
3. Set spending rules
4. Ask the agent to perform a task
5. Receive results and spending summary

Example:

```
Find the five best suppliers
for this product and write
a report.
```

Agent automatically purchases:

- Business records
- Live pricing
- PDF parsing
- Translation

Total:

```
Spent:
$0.71

Remaining:
$19.29
```

---

## Developer

1. Connect API
2. Set pricing
3. Add Stellar wallet
4. Publish

Every successful request instantly pays:

```
Agent Wallet
      │
      ▼
Developer Wallet
```

No subscriptions.

No payouts.

No waiting.

---

# Architecture

```
                    +-----------------------+
                    |      User Wallet      |
                    |  Passkeys + Policies  |
                    +-----------+-----------+
                                |
                                |
                                ▼
                    +-----------------------+
                    |     AI Agent Client   |
                    +-----------+-----------+
                                |
                                |
                     Calls Paid Tool
                                |
                                ▼
                    +-----------------------+
                    |   Tael SDK Wrapper    |
                    +-----------+-----------+
                                |
                  HTTP 402 Payment Required
                                |
                                ▼
                  +--------------------------+
                  |  x402 Payment Verification|
                  +------------+-------------+
                               |
                      Stellar Settlement
                               |
                               ▼
                 Developer receives USDC
                               |
                               ▼
                      Tool executes request
```

---

# Technology Stack

## Blockchain

- Stellar
- Soroban
- USDC
- Sponsored Transactions

---

## Payments

- Coinbase x402
- Micropayment Protocol (MPP)

---

## Backend

- TypeScript
- Node.js
- Supabase
- PostgreSQL

---

## Frontend

- Next.js
- React
- Tailwind CSS

---

## Authentication

- WebAuthn
- Passkeys
- Smart Accounts

---

# Why Stellar?

Tael depends on extremely cheap transactions.

Stellar provides:

- Near-zero fees
- Fast finality
- Native USDC
- Sponsored transactions
- Excellent micropayment economics

Agents never need to own XLM.

They only spend USDC.

---

# Security

Tael is non-custodial.

Funds always move directly between:

```
Agent Wallet
      │
      ▼
Developer Wallet
```

Tael never holds user funds.

Each agent receives a scoped signer that can only spend within the limits defined by the wallet owner.

Example policy:

```
Maximum per call:
$0.50

Daily budget:
$5

Allowed categories:
✓ Research
✓ Data
✓ OCR

Blocked:

✗ Gambling
✗ Unknown merchants
```

Even if an agent becomes compromised, it cannot exceed its on-chain policy.

---

# Roadmap

## Phase 1

- SDK
- x402 integration
- Smart wallet
- HTTP APIs

---

## Phase 2

- MCP Wrapper
- Marketplace
- Dashboard
- Revenue analytics

---

## Phase 3

- Agent Directory
- Discovery
- MPP sessions
- Mainnet

---

# Vision

The internet was built for humans.

The next internet will be built for autonomous software.

Just as Stripe became the payment infrastructure for online businesses, Tael is building the payment infrastructure for AI agents.

We envision a future where millions of autonomous agents discover, purchase, and use digital services without requiring human intervention.

Developers publish tools.

Agents buy capabilities.

Software pays software.

Tael makes it possible.

---

# Contributing

We welcome contributions from developers building the future of autonomous commerce.

---

# License

MIT

---

<div align="center">

**Built with ❤️ on Stellar**

Making AI agents economically autonomous.

</div>
