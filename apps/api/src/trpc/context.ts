import { type Container } from "../container";

/**
 * The per-request tRPC context. Holds the DI container so procedures reach the
 * domain services without importing them directly (keeps routers thin + testable).
 */
export interface Context {
  container: Container;
}

export function createContextFactory(container: Container): () => Context {
  return () => ({ container });
}
