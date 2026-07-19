// @tael/sdk — the developer-facing SDK.
//
// Two sides:
//  - `tael()` (sell): wrap any Fetch-style handler with x402 payments in one
//    call. Framework agnostic (Hono, Next.js, Bun, Deno, Workers) because it
//    speaks the Web `Request`/`Response` standard.
//  - `Tael` (buy): call any capability on the marketplace with one API key —
//    the gateway pays from the Card your key is linked to, within its caps.
export * from "./tael";

// The buy-side client: call any capability with one API key. Also the publish
// side: manage the capabilities you sell (publish, update, list, unpublish).
export {
  Tael,
  TaelError,
  type TaelClientOptions,
  type TaelResponse,
  type CallOptions,
  type ListOptions,
  type CatalogCapability,
  type PublishCapabilityInput,
  type PublishOperation,
  type PublishAuth,
  type OwnedCapability,
} from "./client";

// Re-export the payment primitives SDK users commonly need at the call site.
export {
  createMockVerifier,
  type PaymentVerifier,
  type PaymentNetwork,
  type SettlementReceipt,
} from "@tael/payments";
