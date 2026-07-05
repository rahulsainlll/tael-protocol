import { describe, expect, it } from "vitest";
import { PaymentVerificationError } from "@tael/types";
import {
  buildPaymentRequired,
  decodePaymentHeader,
  encodePaymentPayload,
  X402_VERSION,
  type PaymentPayload,
} from "./x402";
import { createMockVerifier, verifyPayment } from "./verify";

const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

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
