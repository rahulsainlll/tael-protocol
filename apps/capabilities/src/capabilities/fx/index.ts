import type { CapabilityModule } from "../../types";
import { routes } from "./routes";
import { manifest } from "./manifest";

/** FX rates: reference fiat exchange rates, a non-Stellar utility published to Tael. */
export const capability: CapabilityModule = { routes, manifest };
