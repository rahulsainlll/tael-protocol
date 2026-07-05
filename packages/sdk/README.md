# @tael/sdk

Wrap any HTTP handler with x402 payments in **one call**.

```ts
import { createTael } from "@tael/sdk";

const paid = createTael({ payTo, issuer, network: "stellar-testnet", verifier });

// Every call to this handler now requires a $0.02 USDC payment.
export default paid({ price: "0.02", handler: myApi });
```

## How it works

`tael()` returns a standard Fetch handler `(Request) => Promise<Response>`:

1. No `X-PAYMENT` header → responds `402` with the payment challenge.
2. Valid payment → verifies via the injected `PaymentVerifier`, runs your handler, and echoes an
   `X-PAYMENT-RESPONSE` receipt.

Because it speaks the Web `Request`/`Response` standard, it drops into Hono, Next.js route handlers,
Bun, Deno, and Cloudflare Workers unchanged.

## Boundaries

- **Belongs here:** the developer-facing ergonomics of gating a handler behind a payment.
- **Never here:** chain-specific settlement (injected via `verifier`, implemented by `@tael/stellar`)
  or the protocol wire format (owned by `@tael/payments`).
