# @tael/payments

The **x402 / HTTP-402 payment protocol**, typed end to end.

- `buildPaymentRequired()` — produce the `402 Payment Required` body from a price.
- `encodePaymentPayload()` / `decodePaymentHeader()` — the `X-PAYMENT` proof envelope.
- `verifyPayment()` — validate protocol invariants, then delegate to a `PaymentVerifier`.

## Boundaries

This package owns the **protocol envelope only**. It never talks to a blockchain. On-chain
verification/settlement is injected via the `PaymentVerifier` port — the real implementation lives
in [`@tael/stellar`](../stellar), and tests use `createMockVerifier()`.

- **Belongs here:** x402 message shapes, header encoding, scheme/network validation.
- **Never here:** Stellar SDK calls, database access, HTTP framework code.

> Runtime note: header encoding uses Node's `Buffer`. Consumed server-side (api, sdk).
