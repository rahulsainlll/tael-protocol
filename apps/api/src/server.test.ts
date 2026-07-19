import { describe, expect, it } from "vitest";
import { createContainer } from "./container";
import { type Env } from "./env";
import { createServer } from "./server";

const testEnv: Env = {
  NODE_ENV: "test",
  API_PORT: 3001,
  API_PUBLIC_URL: "http://localhost:3001",
  STELLAR_NETWORK: "testnet",
  STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
  USDC_ISSUER: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  TAEL_FEE_BPS: 100,
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 120,
  IDEMPOTENCY_TTL_MS: 600000,
  PARTNER_HMAC_SECRET: undefined,
};

const app = createServer(createContainer(testEnv));

describe("api server", () => {
  it("serves a health check", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", service: "tael-api" });
  });
});
