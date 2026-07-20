import { Hono } from "hono";
import type { CapabilityMeta, CapabilityModule, Operation } from "./types";

/**
 * Build a capability's Hono routes + publish manifest from its metadata and the
 * list of operations collected from its `operations/` folder. Each operation's
 * handler is mounted at its path; each operation's manifest fields (everything
 * except the handler) go into the published manifest.
 */
export function assemble(meta: CapabilityMeta, operations: Operation[]): CapabilityModule {
  const routes = new Hono();
  for (const op of operations) {
    routes.on(op.method ?? "GET", op.path ?? "/", op.handler);
  }
  const manifest = {
    ...meta,
    operations: operations.map(({ handler: _handler, ...op }) => op),
  };
  return { routes, manifest };
}
