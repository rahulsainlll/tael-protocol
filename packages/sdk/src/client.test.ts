import { describe, expect, it, vi } from "vitest";
import { PAYMENT_RESPONSE_HEADER } from "@tael/payments";
import { Tael, TaelError } from "./client";

const KEY = "tael_live_test123";

/** A fetch stub that captures the last request and returns a canned response. */
function stubFetch(response: Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function receiptHeader(): string {
  const receipt = { txHash: "abc", network: "stellar-testnet", settledAt: "now", payer: "G..." };
  return Buffer.from(JSON.stringify(receipt), "utf8").toString("base64");
}

describe("Tael client", () => {
  it("requires an apiKey", () => {
    expect(() => new Tael({ apiKey: "" })).toThrow(/apiKey/);
  });

  it("GETs a capability with the key attached and returns data directly", async () => {
    const { fn, calls } = stubFetch(jsonResponse({ fact: "cats purr" }));
    const tael = new Tael({ apiKey: KEY, baseUrl: "https://gw.test", fetch: fn });

    const data = await tael.get<{ fact: string }>("cat-facts");

    expect(data).toEqual({ fact: "cats purr" });
    expect(calls[0]?.url).toBe("https://gw.test/c/cat-facts");
    expect(calls[0]?.init?.method).toBe("GET");
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${KEY}`);
  });

  it("POSTs a JSON body and decodes the settlement receipt", async () => {
    const { fn, calls } = stubFetch(
      jsonResponse(
        { ok: true },
        {
          headers: {
            "content-type": "application/json",
            [PAYMENT_RESPONSE_HEADER]: receiptHeader(),
          },
        },
      ),
    );
    const tael = new Tael({ apiKey: KEY, baseUrl: "https://gw.test", fetch: fn });

    const res = await tael.call("claude", { method: "POST", body: { prompt: "hi" } });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
    expect(res.receipt?.txHash).toBe("abc");
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ prompt: "hi" }));
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("throws TaelError with the gateway's message on a non-2xx", async () => {
    const { fn } = stubFetch(
      jsonResponse({ error: "Over this Card's per-call cap." }, { status: 403 }),
    );
    const tael = new Tael({ apiKey: KEY, baseUrl: "https://gw.test", fetch: fn });

    await expect(tael.get("expensive")).rejects.toMatchObject({
      name: "TaelError",
      status: 403,
      message: "Over this Card's per-call cap.",
    });
    await expect(tael.get("expensive")).rejects.toBeInstanceOf(TaelError);
  });

  it("lists and searches the catalog", async () => {
    const { fn, calls } = stubFetch(
      jsonResponse({ capabilities: [{ slug: "weather-now", name: "Weather Now" }] }),
    );
    const tael = new Tael({ apiKey: KEY, baseUrl: "https://gw.test", fetch: fn });

    const results = await tael.search("weather", { limit: 10 });

    expect(results[0]?.slug).toBe("weather-now");
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe("/capabilities");
    expect(url.searchParams.get("q")).toBe("weather");
    expect(url.searchParams.get("limit")).toBe("10");
  });
});
