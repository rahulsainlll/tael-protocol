import type { CapabilityModule } from "../../types";
import { routes } from "./routes";
import { manifest } from "./manifest";

/** The Stellar Asset capability: supply, holders, and flags for an asset. */
export const capability: CapabilityModule = { routes, manifest };
