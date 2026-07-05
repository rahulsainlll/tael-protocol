import { Networks } from "@stellar/stellar-sdk";
import { type StellarAddress } from "@tael/types";

export type StellarNetwork = "testnet" | "mainnet";

export interface StellarConfig {
  network: StellarNetwork;
  /** Horizon REST endpoint used to submit classic transactions. */
  horizonUrl: string;
  /** Canonical USDC issuer on the configured network. */
  usdcIssuer: StellarAddress;
}

/** The network passphrase used when signing/submitting transactions. */
export function networkPassphrase(network: StellarNetwork): string {
  return network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
}
