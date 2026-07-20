import type { CapabilityModule } from "../../types";
import { routes } from "./routes";
import { manifest } from "./manifest";

/** Stellar network status: latest ledger + network parameters, published to Tael. */
export const capability: CapabilityModule = { routes, manifest };
