# @tael/sdk

[![npm version](https://img.shields.io/npm/v/@tael/sdk?logo=npm&color=000000)](https://www.npmjs.com/package/@tael/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@tael/sdk?color=000000)](https://www.npmjs.com/package/@tael/sdk)
[![license](https://img.shields.io/npm/l/@tael/sdk?color=000000)](https://github.com/rahulsainlll/tael-protocol/blob/main/LICENSE)

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

## Publish: list your product as a capability from code

Turn any product into a paid capability with a single call, using the same API key. No dashboard, no forms. The listing goes live in the marketplace immediately, marked `pending`, and stays fully callable while the Tael team reviews it for the Verified badge. This works for every kind of product through the same method.

```ts
import { Tael } from "@tael/sdk";

const tael = new Tael({ apiKey: process.env.TAEL_KEY! });

const capability = await tael.publish({
  name: "Treasury Tools",
  kind: "mcp",
  description: "On-Stellar agentic actions and treasury tools for AI agents.",
  endpoint: "https://api.example.com/tools",
  auth: { scheme: "header", header: "x-api-key" },
  secret: process.env.MY_UPSTREAM_TOKEN,
  payTo: "G...", // your Stellar payout address (needs a USDC trustline for Tael's issuer)
  operations: [
    { name: "Check balance", path: "/check-balance", method: "POST", price: "0.001" },
    { name: "Get address", path: "/get-address", method: "POST", price: "0" },
  ],
  faqs: [{ question: "What does check balance return?", answer: "The calling card's balances." }],
});

console.log(capability); // { id, slug, status: "pending" }
```

### The manifest, field by field

| Field         | Required | What it is                                                                                                                                |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | yes      | A human name for your capability, 2 to 80 characters.                                                                                     |
| `kind`        | yes      | One of `api`, `mcp`, `agent`, `model`, `dataset`, `credit`. See the table below.                                                          |
| `description` | yes      | One or two sentences on what it does and what a buyer gets, 10 to 500 characters.                                                         |
| `endpoint`    | yes      | The real upstream URL Tael proxies each call to.                                                                                          |
| `payTo`       | yes      | The Stellar address that receives your USDC earnings. It must hold a USDC trustline for Tael's issuer, or payments are rejected on-chain. |
| `operations`  | yes      | The priced actions your capability exposes. At least one. See below.                                                                      |
| `auth`        | no       | How Tael authenticates to your endpoint. Defaults to `bearer`.                                                                            |
| `secret`      | no       | Your upstream key. It is encrypted at rest and never returned.                                                                            |
| `faqs`        | no       | Buyer-facing questions and answers you write about your product.                                                                          |
| `logoUrl`     | no       | A logo URL for the marketplace listing.                                                                                                   |
| `contact`     | no       | An email, link, or handle buyers can reach you at.                                                                                        |
| `visibility`  | no       | `public` (default), `unlisted`, or `private`.                                                                                             |
| `billing`     | no       | Per-token metering for `model` kinds: `{ metered: true, model, maxTokens }`.                                                              |

### Choosing a kind

| Kind      | Use it for                                                  |
| --------- | ----------------------------------------------------------- |
| `api`     | Any REST or HTTP endpoint, such as OCR, weather, or search. |
| `mcp`     | A Model Context Protocol server, or a single tool from one. |
| `agent`   | A hosted agent that takes a task and returns a result.      |
| `model`   | An inference endpoint, billed per token (set `billing`).    |
| `dataset` | A paid data feed or query endpoint.                         |
| `credit`  | An agent credit line (borrowing capacity), read on demand.  |

### Authentication to your endpoint

Tael injects your credential on the server, so buyers never see it. Choose how it is sent:

```ts
auth: { scheme: "bearer" }                              // Authorization: Bearer <secret>  (default)
auth: { scheme: "header", header: "x-api-key" }         // x-api-key: <secret>  (e.g. Anthropic)
auth: { scheme: "none" }                                // no secret sent
auth: { scheme: "header", header: "x-api-key",
        extraHeaders: { "anthropic-version": "2023-06-01" } }  // plus static headers
```

### Operations and pricing

Each operation is one priced action, reachable at `/<slug>/<operation>`. `path` is appended to your `endpoint`; a price of `"0"` makes an operation free.

```ts
operations: [
  { name: "Swap", path: "/swap", method: "POST", price: "0.01" }, // paid
  { name: "Get a quote", path: "/quote", method: "POST", price: "0" }, // free
];
```

### Manage what you publish

```ts
await tael.updateCapability(capability.id, { secret: NEW_TOKEN }); // change only what you pass
const mine = await tael.myCapabilities(); // list your capabilities
await tael.unpublish(capability.id); // remove it
```

On update, only the fields you pass change, and a blank `secret` keeps the current one. This is how you fix an endpoint, rotate a token, or reprice, all from code.

### For AI agents

An agent can onboard a product end to end: read this section, produce a manifest from the fields above, and call `tael.publish(manifest)`. Every call returns typed data, and a failure throws a `TaelError` with the exact status and message, so an agent can correct the manifest and try again without a human in the loop.

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
