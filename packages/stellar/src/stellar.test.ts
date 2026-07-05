import { Networks } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { networkPassphrase } from "./config";
import { usdcAsset, USDC_CODE } from "./usdc";

const ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

describe("networkPassphrase", () => {
  it("maps networks to Stellar passphrases", () => {
    expect(networkPassphrase("testnet")).toBe(Networks.TESTNET);
    expect(networkPassphrase("mainnet")).toBe(Networks.PUBLIC);
  });
});

describe("usdcAsset", () => {
  it("builds a USDC asset for an issuer", () => {
    const asset = usdcAsset(ISSUER);
    expect(asset.getCode()).toBe(USDC_CODE);
    expect(asset.getIssuer()).toBe(ISSUER);
  });
});
