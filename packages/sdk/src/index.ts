// @tael/sdk — the developer-facing SDK.
// Wrap any Fetch-style handler with x402 payments in one call. Framework
// agnostic (Hono, Next.js route handlers, Bun, Deno, Workers) because it speaks
// the Web `Request`/`Response` standard. Composes @tael/payments; the settlement
// verifier is injected so the SDK stays chain-agnostic.
export * from "./tael";

// Re-export the payment primitives SDK users commonly need at the call site.
export {
  createMockVerifier,
  type PaymentVerifier,
  type PaymentNetwork,
  type SettlementReceipt,
} from "@tael/payments";
