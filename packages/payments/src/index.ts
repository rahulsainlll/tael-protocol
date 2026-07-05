// @tael/payments — the x402 / HTTP-402 payment protocol.
// Builds 402 challenges, encodes/decodes the X-PAYMENT proof, and orchestrates
// verification through a pluggable PaymentVerifier port. It knows the protocol
// envelope, not the chain — settlement lives in @tael/stellar.
export * from "./x402";
export * from "./verify";
