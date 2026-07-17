# @tael/sdk

The official SDK for [Tael](https://taelprotocol.xyz), the payment layer for AI agents. Two sides in one package:

- **Buy** any capability on the Tael marketplace with a single API key.
- **Sell** your own service by wrapping any HTTP handler with x402 payments in one line.

```bash
pnpm add @tael/sdk   # or npm / yarn / bun
```

## Buy: call any capability with one key

Create a key in the dashboard under **API Keys** and link it to a funded **Card**. Then call any capability, and payment happens automatically from that Card, within the caps you set. You never sign a transaction.

```ts
import { Tael } from "@tael/sdk";

const tael = new Tael({ apiKey: process.env.TAEL_KEY! });

const facts = await tael.get("cat-facts"); // GET a capability
const reply = await tael.post("claude", { prompt: "Summarize this." }); // POST a capability
```

Capabilities can expose several priced operations. Address one with `capability/operation`:

```ts
await tael.post("nebula/swap", { amount: "5" });
```

**Discover** what is available at runtime:

```ts
const all = await tael.list(); // every capability
const found = await tael.search("weather"); // by name or description
```

**Receipts.** Use `call()` when you want the full response, including the on-chain settlement receipt:

```ts
const res = await tael.call("cat-facts");
res.data; // the capability's response
res.status; // HTTP status
res.receipt?.txHash; // proof the USDC payment settled on Stellar
```

**Errors.** A failed call throws a `TaelError` carrying the gateway's message and status:

```ts
import { Tael, TaelError } from "@tael/sdk";

try {
  await tael.post("claude", { prompt: "hi" });
} catch (err) {
  if (err instanceof TaelError) {
    console.error(err.status, err.message); // e.g. 403 "Over this Card's per-call cap."
  }
}
```

## Sell: put a price on your own service

The `tael()` wrapper turns any Fetch handler into a payment-gated one. `createTael()` binds your settlement details once and returns a `paid()` factory:

```ts
import { createTael } from "@tael/sdk";

const paid = createTael({ payTo, issuer, network: "stellar-testnet", verifier });

// Every call to this handler now requires a $0.02 USDC payment.
export default paid({ price: "0.02", handler: myApi });
```

How it works. `tael()` returns a standard Fetch handler `(Request) => Promise<Response>`:

1. No `X-PAYMENT` header returns a `402` with the payment challenge.
2. A valid payment is verified via the injected `PaymentVerifier`, your handler runs, and an `X-PAYMENT-RESPONSE` receipt is echoed back.

Because it speaks the Web `Request`/`Response` standard, it drops into Hono, Next.js route handlers, Bun, Deno, and Cloudflare Workers unchanged.

## Docs

- [Call a capability](https://taelprotocol.xyz/docs/call-a-capability)
- [Wrap an API](https://taelprotocol.xyz/docs/wrap-an-api)
- [Node.js SDK reference](https://taelprotocol.xyz/docs/sdk/node)

## Boundaries

- **Belongs here:** the developer-facing ergonomics of buying a capability and of gating a handler behind a payment.
- **Never here:** chain-specific settlement (injected via `verifier`, implemented by `@tael/stellar`) or the protocol wire format (owned by `@tael/payments`).
