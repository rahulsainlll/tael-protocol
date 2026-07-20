import type { Context, Hono } from "hono";
import type { PublishCapabilityInput, PublishOperation } from "@tael/sdk";

/**
 * Capability-level metadata: everything about a capability except its operations
 * and the publish-time fields. Lives in `capabilities/<name>/capability.ts`.
 */
export type CapabilityMeta = Omit<PublishCapabilityInput, "endpoint" | "payTo" | "operations">;

/**
 * One operation of a capability: its marketplace manifest fields (name, path,
 * price, samples) plus the Hono handler that serves its `path`. Lives in its own
 * file under `capabilities/<name>/operations/`, so adding an operation is a new
 * file and nothing else, no shared file to edit, no conflicts between PRs.
 */
export interface Operation extends PublishOperation {
  handler: (c: Context) => Response | Promise<Response>;
}

/**
 * A fully assembled capability: Hono routes (all its operations mounted) plus the
 * publish manifest. Built by `assemble()` from a capability's meta + operations,
 * and collected into the generated registry. `endpoint` and `payTo` are the same
 * for every first-party capability, so they're injected at publish time.
 */
export interface CapabilityModule {
  routes: Hono;
  manifest: Omit<PublishCapabilityInput, "endpoint" | "payTo">;
}
