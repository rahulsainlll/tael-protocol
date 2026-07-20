import type { CapabilityModule } from "../../types";
import { routes } from "./routes";
import { manifest } from "./manifest";

/** The Stellar capability: read-only Horizon lookups, published to Tael. */
export const capability: CapabilityModule = { routes, manifest };
