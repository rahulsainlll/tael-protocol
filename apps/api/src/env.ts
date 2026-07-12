import { z } from "zod";

/**
 * The API's environment contract. Validated once at boot so a misconfigured
 * deploy fails fast and loudly rather than at the first request. The `.env.example`
 * at the repo root documents these for humans; this schema is the source of truth.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3001"),
  STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
  STELLAR_HORIZON_URL: z.string().url().default("https://horizon-testnet.stellar.org"),
  USDC_ISSUER: z.string().default("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
  // Consumed by @tael/database and its crypto helper. Optional here so tests stay
  // hermetic (the in-memory repos need neither); the gateway throws a clear error
  // at runtime if it's asked to read a capability without them.
  DATABASE_URL: z.string().url().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  // Marketplace fee. When TAEL_FEE_ADDRESS is set, the gateway takes TAEL_FEE_BPS
  // of each call's price and routes it to that Stellar address in the same tx
  // (non-custodial). Unset → no fee (builder keeps 100%). 100 bps = 1%.
  TAEL_FEE_ADDRESS: z.string().optional(),
  TAEL_FEE_BPS: z.coerce.number().int().min(0).max(10000).default(100),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
