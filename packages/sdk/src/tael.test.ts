import { describe, expect, it } from "vitest";
import {
  createMockVerifier,
  encodePaymentPayload,
  PAYMENT_REQUEST_HEADER,
  PAYMENT_RESPONSE_HEADER,
  X402_VERSION,
} from "@tael/payments";
import { tael } from "./tael";

const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const paid = tael({
  price: "0.02",
  payTo: ADDRESS,
  issuer: ADDRESS,
  network: "stellar-testnet",
  verifier: createMockVerifier(),
  handler: () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
});

describe("tael()", () => {
  it("responds 402 with a challenge when no payment is present", async () => {
    const res = await paid(new Request("https://api.tael.dev/v1/ocr"));
    expect(res.status).toBe(402);

    const body = (await res.json()) as {
      x402Version: number;
      accepts: { maxAmountRequired: string }[];
    };
    expect(body.x402Version).toBe(X402_VERSION);
    expect(body.accepts[0]?.maxAmountRequired).toBe("0.02");
  });

  it("runs the handler and echoes a receipt when payment is valid", async () => {
    const header = encodePaymentPayload({
      x402Version: X402_VERSION,
      scheme: "exact",
      network: "stellar-testnet",
      payload: { transaction: "AAAA-signed-xdr" },
    });

    const res = await paid(
      new Request("https://api.tael.dev/v1/ocr", {
        headers: { [PAYMENT_REQUEST_HEADER]: header },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get(PAYMENT_RESPONSE_HEADER)).toBeTruthy();

    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
