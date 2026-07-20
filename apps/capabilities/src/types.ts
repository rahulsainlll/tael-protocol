import type { Hono } from "hono";
import type { PublishCapabilityInput } from "@tael/sdk";

/**
 * One first-party capability, as a self-contained module. Every folder under
 * `src/capabilities/<name>/` exports a `capability` of this shape, and the
 * generated registry (`registry.generated.ts`) collects them all. `server.ts`
 * mounts each `routes` and `publish.ts` upserts each `manifest`, so neither file
 * grows as capabilities are added: you only ever add a folder.
 */
export interface CapabilityModule {
  /**
   * Hono routes for this capability, mounted at the app root. Paths are absolute
   * (e.g. `/stellar/balance`) so they match the operation paths in the manifest.
   */
  routes: Hono;
  /**
   * The marketplace publish manifest. `endpoint` and `payTo` are the same for
   * every first-party capability (this one service, Tael's wallet), so they are
   * injected at publish time from the environment and omitted here.
   */
  manifest: Omit<PublishCapabilityInput, "endpoint" | "payTo">;
}
