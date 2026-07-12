import { describe, expect, it } from "vitest";
import { PaymentVerificationError } from "@tael/types";
import {
  buildPaymentRequired,
  buildPaymentRequirements,
  decodePaymentHeader,
  encodePaymentPayload,
  splitFee,
  X402_VERSION,
  type PaymentPayload,
} from "./x402";
import { createMockVerifier, verifyPayment } from "./verify";

const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const FEE_ADDRESS = "GC62IXD4GCRMGDR34NIWG3TVCECGBJHVW3UW7URX4F6CF54WIOMSLBRK";

describe("splitFee", () => {
  it("splits a price into net + fee using basis points", () => {
    expect(splitFee("0.02", 100)).toEqual({ net: "0.0198", fee: "0.0002" });
    expect(splitFee("1", 250)).toEqual({ net: "0.975", fee: "0.025" });
  });

  it("returns the full amount and zero fee when bps is 0", () => {
    expect(splitFee("0.02", 0)).toEqual({ net: "0.02", fee: "0" });
  });

  it("net + fee always reconstitutes the total (no value lost)", () => {
    // 0.0000001 (one stroop) at 1% rounds the fee down to 0.
    expect(splitFee("0.0000001", 100)).toEqual({ net: "0.0000001", fee: "0" });
  });
});

describe("buildPaymentRequirements with a fee", () => {
  it("emits a fee leg and reduces the main amount", () => {
    const req = buildPaymentRequirements({
      price: "0.02",
      payTo: ADDRESS,
      issuer: ADDRESS,
      network: "stellar-testnet",
      resource: "/c/x",
      fee: { payTo: FEE_ADDRESS, bps: 100 },
    });
    expect(req.maxAmountRequired).toBe("0.0198");
    expect(req.fee).toEqual({ payTo: FEE_ADDRESS, amount: "0.0002" });
  });

  it("omits the fee leg when no fee is set", () => {
    const req = buildPaymentRequirements({
      price: "0.02",
      payTo: ADDRESS,
      issuer: ADDRESS,
      network: "stellar-testnet",
      resource: "/c/x",
    });
    expect(req.maxAmountRequired).toBe("0.02");
    expect(req.fee).toBeUndefined();
  });
});

describe("x402 challenge", () => {
  it("builds a 402 body from a price", () => {
    const challenge = buildPaymentRequired({
      price: "0.02",
      payTo: ADDRESS,
      issuer: ADDRESS,
      network: "stellar-testnet",
      resource: "/v1/ocr",
    });
    expect(challenge.x402Version).toBe(X402_VERSION);
    expect(challenge.accepts[0]?.maxAmountRequired).toBe("0.02");
    expect(challenge.accepts[0]?.payTo).toBe(ADDRESS);
  });
});

describe("payment payload", () => {
  const payload: PaymentPayload = {
    x402Version: X402_VERSION,
    scheme: "exact",
    network: "stellar-testnet",
    payload: { transaction: "AAAA-signed-xdr" },
  };

  it("round-trips through the X-PAYMENT header", () => {
    const header = encodePaymentPayload(payload);
    expect(decodePaymentHeader(header)).toEqual(payload);
  });

  it("rejects a missing header", () => {
    expect(() => decodePaymentHeader(null)).toThrow(PaymentVerificationError);
  });

  it("rejects a malformed header", () => {
    expect(() => decodePaymentHeader("not-base64-json")).toThrow(PaymentVerificationError);
  });
});

describe("verifyPayment", () => {
  it("settles a matching payload via the injected verifier", async () => {
    const requirements = buildPaymentRequired({
      price: "0.02",
      payTo: ADDRESS,
      issuer: ADDRESS,
      network: "stellar-testnet",
      resource: "/v1/ocr",
    }).accepts[0]!;

    const receipt = await verifyPayment(
      {
        x402Version: X402_VERSION,
        scheme: "exact",
        network: "stellar-testnet",
        payload: { transaction: "AAAA" },
      },
      requirements,
      createMockVerifier(),
    );
    expect(receipt.txHash).toMatch(/^mock_/);
    expect(receipt.network).toBe("stellar-testnet");
  });

  it("rejects a network mismatch", async () => {
    const requirements = buildPaymentRequired({
      price: "0.02",
      payTo: ADDRESS,
      issuer: ADDRESS,
      network: "stellar-mainnet",
      resource: "/v1/ocr",
    }).accepts[0]!;

    await expect(
      verifyPayment(
        {
          x402Version: X402_VERSION,
          scheme: "exact",
          network: "stellar-testnet",
          payload: { transaction: "AAAA" },
        },
        requirements,
        createMockVerifier(),
      ),
    ).rejects.toBeInstanceOf(PaymentVerificationError);
  });
});
