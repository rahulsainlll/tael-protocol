import { afterEach, describe, expect, it, vi } from "vitest";
import { InMemoryRateLimiter } from "./rate-limit";

const testRateLimiter = new InMemoryRateLimiter(60000, 120);
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
import { KeyPaymentService, type AuthorizedKey, type KeyAuthorizer } from "../keys/key.service";
import { createServer } from "../../server";

// The only novel-to-#55 dependency we can't run in a unit test is the on-chain
// signer. Mock it so the API-key → auto-pay → proxy chain runs deterministically;
// the real signer is the same one run-capability already exercises in prod.
vi.mock("@tael/stellar", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, buildSignedPayment: vi.fn(async () => "SIGNED-XDR-FROM-CARD") };
});

// The Card's secret is decrypted just before signing; decryption is proven
// elsewhere and needs ENCRYPTION_KEY, so stub it (the mocked signer ignores it).
vi.mock("@tael/database", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, decryptSecret: vi.fn(() => "TEST-CARD-SECRET") };
});

const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const CAPABILITY: ServableCapability = {
  id: "cap-1",
  slug: "predict-age",
  name: "Age Prediction API",
  price: "0.02",
  payTo: ADDRESS,
  upstreamUrl: "https://api.example.com/age",
  upstreamSecretEnc: null,
  upstreamAuth: { scheme: "bearer" },
  operations: [
    { slug: "premium", path: "/premium", price: "0.05" },
    { slug: "ping", path: "/ping", price: "0" },
  ],
};

/** A capability repo that returns the fixture for its slug and null otherwise. */
function fakeCapabilities(capability: ServableCapability | null): CapabilityRepository {
  return {
    findServableBySlug: (slug) =>
      Promise.resolve(capability && slug === capability.slug ? capability : null),
    listCatalog: () =>
      Promise.resolve(
        capability
          ? [
              {
                slug: capability.slug,
                name: capability.name,
                description: "",
                kind: "api",
                method: "GET",
                price: capability.price,
                logoUrl: null,
                verified: true,
              },
            ]
          : [],
      ),
  };
}

/** A KeyPaymentService over a fake authorizer — for exercising the API-key path. */
function fakeKeys(authorizer: Partial<KeyAuthorizer> = {}): KeyPaymentService {
  const repo: KeyAuthorizer = {
    authorize: authorizer.authorize ?? (() => Promise.resolve(null)),
    touch: authorizer.touch ?? (() => Promise.resolve()),
    spentSince: authorizer.spentSince ?? (() => Promise.resolve("0")),
  };
  return new KeyPaymentService(repo, {
    network: "testnet",
    x402Network: "stellar-testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    usdcIssuer: ADDRESS,
  });
}

function buildContainer(
  capability: ServableCapability | null,
  fee?: { feeAddress: string; feeBps: number },
  keys: KeyPaymentService = fakeKeys(),
): {
  container: Container;
  payments: PaymentService;
} {
  const payments = new PaymentService(new InMemoryPaymentRepository());
  const container: Container = {
    wallets: new WalletService(new InMemoryWalletRepository()),
    payments,
    capabilities: fakeCapabilities(capability),
    keys,
    verifier: createMockVerifier(),
    limiter: testRateLimiter,
    gateway: {
      issuer: ADDRESS,
      network: "stellar-testnet",
      publicUrl: "http://localhost:3001",
      feeAddress: fee?.feeAddress,
      feeBps: fee?.feeBps ?? 0,
    },
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
  testRateLimiter.reset();
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

  it("charges the operation's price at /c/:slug/:operation", async () => {
    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);

    // Base capability keeps its headline price…
    const base = await app.request("/c/predict-age");
    const baseBody = (await base.json()) as { accepts: { maxAmountRequired: string }[] };
    expect(baseBody.accepts[0]?.maxAmountRequired).toBe("0.02");

    // …the operation advertises its own.
    const op = await app.request("/c/predict-age/premium");
    expect(op.status).toBe(402);
    const opBody = (await op.json()) as {
      accepts: { maxAmountRequired: string; resource: string }[];
    };
    expect(opBody.accepts[0]?.maxAmountRequired).toBe("0.05");
    expect(opBody.accepts[0]?.resource).toBe("/c/predict-age/premium");
  });

  it("serves a free operation (price 0) with no payment required", async () => {
    const upstream = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ pong: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", upstream);

    const { container, payments } = buildContainer(CAPABILITY);
    const app = createServer(container);

    // No X-PAYMENT, no key — a free op just returns the result.
    const res = await app.request("/c/predict-age/ping");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ pong: true });
    expect(upstream.mock.calls[0]?.[0]).toBe("https://api.example.com/age/ping");
    // Nothing charged, nothing recorded.
    expect(await payments.list()).toHaveLength(0);
  });

  it("404s for an unknown operation on a real capability", async () => {
    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);
    const res = await app.request("/c/predict-age/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("routes an operation call to the base URL + the operation path", async () => {
    const upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);
    await app.request("/c/predict-age/premium", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    expect(upstream.mock.calls[0]?.[0]).toBe("https://api.example.com/age/premium");
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

    // …and the settlement was recorded (no fee configured → builder keeps 100%).
    const ledger = await payments.list();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      capabilityId: "cap-1",
      payee: ADDRESS,
      amount: "0.02",
      fee: "0",
      status: "settled",
    });
    expect(ledger[0]?.txHash).toBeTruthy();
    expect(ledger[0]?.payer).toContain("mock_payer_");
  });

  it("splits out the marketplace fee when one is configured", async () => {
    const feeAddress = "GC62IXD4GCRMGDR34NIWG3TVCECGBJHVW3UW7URX4F6CF54WIOMSLBRK";
    const upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    // 1% fee on a 0.02 price → builder nets 0.0198, Tael takes 0.0002.
    const { container, payments } = buildContainer(CAPABILITY, { feeAddress, feeBps: 100 });
    const app = createServer(container);

    // The 402 challenge advertises the split.
    const challenge = await app.request("/c/predict-age");
    const body = (await challenge.json()) as {
      accepts: { maxAmountRequired: string; fee?: { payTo: string; amount: string } }[];
    };
    expect(body.accepts[0]?.maxAmountRequired).toBe("0.0198");
    expect(body.accepts[0]?.fee).toEqual({ payTo: feeAddress, amount: "0.0002" });

    // And a paid call records the builder's net + Tael's fee.
    await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });
    const ledger = await payments.list();
    expect(ledger[0]).toMatchObject({ amount: "0.0198", fee: "0.0002", status: "settled" });
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

  it("401s when an API key is unknown or revoked", async () => {
    const { container } = buildContainer(CAPABILITY); // default authorizer → null
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      headers: { authorization: "Bearer tael_live_deadbeef" },
    });
    expect(res.status).toBe(401);
  });

  it("402s when the API key has no linked Card", async () => {
    const keys = fakeKeys({
      authorize: (): Promise<AuthorizedKey | null> => Promise.resolve({ id: "k1", card: null }),
    });
    const { container } = buildContainer(CAPABILITY, undefined, keys);
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      headers: { authorization: "Bearer tael_live_abc123" },
    });
    expect(res.status).toBe(402);
  });

  it("403s when the call exceeds the Card's per-call cap (before signing)", async () => {
    const keys = fakeKeys({
      authorize: (): Promise<AuthorizedKey | null> =>
        Promise.resolve({
          id: "k1",
          card: {
            agentId: "a1",
            address: ADDRESS,
            secretEnc: "unused",
            policy: { maxPerCall: "0.01", dailyLimit: "5", blockedPublishers: [] },
          },
        }),
    });
    // Capability price 0.02 > the Card's 0.01 per-call cap.
    const { container, payments } = buildContainer(CAPABILITY, undefined, keys);
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      headers: { authorization: "Bearer tael_live_abc123" },
    });
    expect(res.status).toBe(403);
    expect(await payments.list()).toHaveLength(0);
  });

  it("lists the public catalog at GET /capabilities", async () => {
    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);

    const res = await app.request("/capabilities");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      capabilities: { slug: string; name: string; price: string; verified: boolean }[];
    };
    expect(body.capabilities).toHaveLength(1);
    expect(body.capabilities[0]).toMatchObject({
      slug: "predict-age",
      name: "Age Prediction API",
      price: "0.02",
      verified: true,
    });
  });

  it("auto-pays from the linked Card and proxies when the API key is valid", async () => {
    const upstream = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ age: 41 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", upstream);

    const keys = fakeKeys({
      authorize: (): Promise<AuthorizedKey | null> =>
        Promise.resolve({
          id: "k1",
          card: {
            agentId: "a1",
            address: ADDRESS,
            secretEnc: "unused",
            policy: { maxPerCall: "1", dailyLimit: "10", blockedPublishers: [] },
          },
        }),
    });
    const { container, payments } = buildContainer(CAPABILITY, undefined, keys);
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      headers: { authorization: "Bearer tael_live_valid" },
    });

    // The call succeeded without the caller ever attaching a payment header…
    expect(res.status).toBe(200);
    expect(res.headers.get(PAYMENT_RESPONSE_HEADER)).toBeTruthy();
    expect(await res.json()).toEqual({ age: 41 });

    // …the upstream ran, and the settlement was recorded against the Card.
    expect(upstream).toHaveBeenCalledOnce();
    const ledger = await payments.list();
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ amount: "0.02", fee: "0", status: "settled" });
  });

  it("proxies with custom header authentication scheme", async () => {
    const upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const customCapability: ServableCapability = {
      ...CAPABILITY,
      upstreamSecretEnc: "encrypted-key",
      upstreamAuth: {
        scheme: "header",
        header: "x-api-key",
        extraHeaders: { "anthropic-version": "2023-06-01" },
      },
    };

    const { container } = buildContainer(customCapability);
    const app = createServer(container);

    await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    expect(upstream).toHaveBeenCalledOnce();
    const forwarded = upstream.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(forwarded.headers);
    expect(headers.get("x-api-key")).toBe("TEST-CARD-SECRET");
    expect(headers.get("anthropic-version")).toBe("2023-06-01");
    expect(headers.has("authorization")).toBe(false);
  });

  it("proxies with bearer authentication scheme as default/fallback", async () => {
    const upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const bearerCapability: ServableCapability = {
      ...CAPABILITY,
      upstreamSecretEnc: "encrypted-key",
      upstreamAuth: { scheme: "bearer" },
    };

    const { container } = buildContainer(bearerCapability);
    const app = createServer(container);

    await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    expect(upstream).toHaveBeenCalledOnce();
    const forwarded = upstream.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(forwarded.headers);
    expect(headers.get("authorization")).toBe("Bearer TEST-CARD-SECRET");
  });

  it("proxies with none authentication scheme (no secret injected)", async () => {
    const upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const noneCapability: ServableCapability = {
      ...CAPABILITY,
      upstreamSecretEnc: "encrypted-key",
      upstreamAuth: {
        scheme: "none",
        extraHeaders: { "x-static-only": "yes" },
      },
    };

    const { container } = buildContainer(noneCapability);
    const app = createServer(container);

    await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    expect(upstream).toHaveBeenCalledOnce();
    const forwarded = upstream.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(forwarded.headers);
    expect(headers.has("authorization")).toBe(false);
    expect(headers.get("x-static-only")).toBe("yes");
  });

  it("proxies a streaming response without buffering it", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("chunk1"));
        controller.enqueue(encoder.encode("chunk2"));
        controller.close();
      },
    });

    const upstream = vi.fn<typeof fetch>(
      async () =>
        new Response(stream, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }),
    );
    vi.stubGlobal("fetch", upstream);

    const { container } = buildContainer(CAPABILITY);
    const app = createServer(container);

    const res = await app.request("/c/predict-age", {
      method: "POST",
      headers: { [PAYMENT_REQUEST_HEADER]: paymentHeader() },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();

    const decoder = new TextDecoder();
    let result = "";
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    expect(result).toBe("chunk1chunk2");
  });

  describe("gateway rate limiting", () => {
    it("allows requests within the configured rate limit", async () => {
      testRateLimiter.reset(60000, 2);

      const { container } = buildContainer(CAPABILITY);
      const app = createServer(container);

      // Call 1
      let res = await app.request("/capabilities");
      expect(res.status).toBe(200);

      // Call 2
      res = await app.request("/capabilities");
      expect(res.status).toBe(200);
    });

    it("returns 429 Too Many Requests with Retry-After when limit is exceeded", async () => {
      testRateLimiter.reset(60000, 2);

      const { container } = buildContainer(CAPABILITY);
      const app = createServer(container);

      // Call 1
      let res = await app.request("/capabilities");
      expect(res.status).toBe(200);

      // Call 2
      res = await app.request("/capabilities");
      expect(res.status).toBe(200);

      // Call 3 -> Exceeded!
      res = await app.request("/capabilities");
      expect(res.status).toBe(429);
      expect(await res.json()).toEqual({ error: "Rate limit exceeded" });
      expect(res.headers.get("Retry-After")).toBeTruthy();
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    });

    it("limits different IP addresses independently", async () => {
      testRateLimiter.reset(60000, 1);

      const { container } = buildContainer(CAPABILITY);
      const app = createServer(container);

      // IP 1: Call 1 -> OK
      let res = await app.request("/capabilities", {
        headers: { "x-forwarded-for": "1.1.1.1" },
      });
      expect(res.status).toBe(200);

      // IP 1: Call 2 -> 429
      res = await app.request("/capabilities", {
        headers: { "x-forwarded-for": "1.1.1.1" },
      });
      expect(res.status).toBe(429);

      // IP 2: Call 1 -> OK (different IP is independent)
      res = await app.request("/capabilities", {
        headers: { "x-forwarded-for": "2.2.2.2" },
      });
      expect(res.status).toBe(200);
    });

    it("limits different API keys independently", async () => {
      testRateLimiter.reset(60000, 1);

      const { container } = buildContainer(CAPABILITY);
      const app = createServer(container);

      // Key 1: Call 1 -> OK
      let res = await app.request("/capabilities", {
        headers: { authorization: "Bearer tael_live_key1" },
      });
      expect(res.status).toBe(200);

      // Key 1: Call 2 -> 429
      res = await app.request("/capabilities", {
        headers: { authorization: "Bearer tael_live_key1" },
      });
      expect(res.status).toBe(429);

      // Key 2: Call 1 -> OK (different Key is independent)
      res = await app.request("/capabilities", {
        headers: { authorization: "Bearer tael_live_key2" },
      });
      expect(res.status).toBe(200);
    });
  });
});
