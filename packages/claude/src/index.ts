// @tael/claude — Claude-powered helpers.
// Uses the Anthropic SDK (cheapest model, Haiku) for low-stakes, high-volume
// tasks like generating a capability's FAQ at publish time. Metered per call:
// the publisher pays (see usage.ts), Tael does not subsidize.
export * from "./client";
export * from "./usage";
export * from "./faq";
