import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMockVerifier,
  encodePaymentPayload,
  PAYMENT_REQUEST_HEADER,
  PAYMENT_RESPONSE_HEADER,
  X402_VERSION,
} from "@tael/payments";
import { type Container } from "../../container";
import { WalletService } from "../wallets/wallet.service";
import { InMemoryWalletRepository } from "../wallets/wallet.repository";
import { PaymentService } from "../payments/payment.service";
import { InMemoryPaymentRepository } from "../payments/payment.repository";
import {
  type CapabilityRepository,
  type ServableCapability,
} from "../capabilities/capability.repository";
import { createServer } from "../../server";

const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const CAPABILITY: ServableCapability = {
  id: "cap-1",
  slug: "predict-age",
  name: "Age Prediction API",
  price: "0.02",
  payTo: ADDRESS,
  upstreamUrl: "https://api.example.com/age",
  upstreamSecretEnc: null,
};

/** A capability repo that returns the fixture for its slug and null otherwise. */
function fakeCapabilities(capability: ServableCapability | null): CapabilityRepository {
  return {
    findServableBySlug: (slug) =>
      Promise.resolve(capability && slug === capability.slug ? capability : null),
  };
}

function buildContainer(capability: ServableCapability | null): {
  container: Container;
  payments: PaymentService;
} {
  const payments = new PaymentService(new InMemoryPaymentRepository());
  const container: Container = {
    wallets: new WalletService(new InMemoryWalletRepository()),
    payments,
    capabilities: fakeCapabilities(capability),
    verifier: createMockVerifier(),
    gateway: { issuer: ADDRESS, network: "stellar-testnet", publicUrl: "http://localhost:3001" },
  };
  return { container, payments };
}

function paymentHeader(): string {
  return encodePaymentPayload({
    x402Version: X402_VERSION,
    scheme: "exact",
    network: "stellar-testnet",
    payload: { transaction: "AAAA-signed-xdr" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("capability gateway", () => {
  it("returns a 402 challenge when no payment is present", async () => {
    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);

    const res = await app.request("/c/predict-age");
    expect(res.status).toBe(402);

    const body = (await res.json()) as {
      x402Version: number;
      accepts: { maxAmountRequired: string; payTo: string; resource: string }[];
    };
    expect(body.x402Version).toBe(X402_VERSION);
    expect(body.accepts[0]?.maxAmountRequired).toBe("0.02");
    expect(body.accepts[0]?.payTo).toBe(ADDRESS);
    expect(body.accepts[0]?.resource).toBe("/c/predict-age");
  });

  it("proxies to the upstream and records the payment when paid", async () => {
    const upstream = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ age: 41 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", upstream);

    const { container, payments } = buildContainer(CAPABILITY);
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader(), "content-type": "application/json" },
      body: JSON.stringify({ name: "tael" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get(PAYMENT_RESPONSE_HEADER)).toBeTruthy();
    expect(await res.json()).toEqual({ age: 41 });

    // Upstream was actually called…
    expect(upstream).toHaveBeenCalledOnce();
    expect(upstream.mock.calls[0]?.[0]).toBe("https://api.example.com/age");

    // …and the settlement was recorded.
    const ledger = await payments.list();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      capabilityId: "cap-1",
      payee: ADDRESS,
      amount: "0.02",
      status: "settled",
    });
    expect(ledger[0]?.txHash).toBeTruthy();
    expect(ledger[0]?.payer).toContain("mock_payer_");
  });

  it("does not forward the X-PAYMENT header to the upstream", async () => {
    const upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);

    await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    const forwarded = upstream.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(forwarded.headers);
    expect(headers.has("x-payment")).toBe(false);
  });

  it("404s for an unknown or non-servable capability", async () => {
    const { container } = buildContainer(null);
    const app = createServer(container);

    const res = await app.request("/c/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("502s (without charging) when the upstream is an internal address", async () => {
    const upstream = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", upstream);

    const { container, payments } = buildContainer({
      ...CAPABILITY,
      upstreamUrl: "http://localhost:9999/secret",
    });
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    expect(res.status).toBe(502);
    expect(upstream).not.toHaveBeenCalled();
    expect(await payments.list()).toHaveLength(0);
  });
});
