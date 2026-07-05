import { Asset } from "@stellar/stellar-sdk";
import { type StellarAddress } from "@tael/types";

export const USDC_CODE = "USDC" as const;

/** Build the USDC {@link Asset} for a given issuer. */
export function usdcAsset(issuer: StellarAddress): Asset {
  return new Asset(USDC_CODE, issuer);
}
