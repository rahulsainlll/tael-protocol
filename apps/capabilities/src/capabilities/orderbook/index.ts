import type { CapabilityModule } from "../../types";
import { routes } from "./routes";
import { manifest } from "./manifest";

/** Stellar DEX orderbook: top bids/asks for a pair, published to Tael. */
export const capability: CapabilityModule = { routes, manifest };
