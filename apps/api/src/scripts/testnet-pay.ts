/**
 * Manual operator script — pay for a capability on TESTNET, end to end, against a
 * running gateway. Proves the REAL settlement path (a real signed Stellar tx
 * submitted to Horizon), not the dev mock verifier.
 *
 * Prereqs (testnet):
 *   - PAYER_SECRET: a funded testnet account (XLM for fees) with a USDC trustline
 *     and USDC balance.
 *   - The capability's payTo AND the Tael fee address must have USDC trustlines
 *     (Stellar can't pay an account that hasn't opted into the asset).
 *   - The gateway must run with NODE_ENV=production so it uses the real verifier.
 *
 * Usage:
 *   GATEWAY_URL=http://localhost:3001 SLUG=<slug> PAYER_SECRET=S... \
 *     pnpm --filter @tael/api pay:testnet
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { networkPassphrase, type StellarNetwork } from "@tael/stellar";

interface Requirement {
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: { code: string; issuer: string };
  fee?: { payTo: string; amount: string };
}

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:3001";
const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const NETWORK = (process.env.STELLAR_NETWORK ?? "testnet") as StellarNetwork;

async function main(): Promise<void> {
  const slug = process.env.SLUG;
  const secret = process.env.PAYER_SECRET;
  if (!slug || !secret) throw new Error("Set SLUG and PAYER_SECRET env vars.");

  const payer = Keypair.fromSecret(secret);

  // 1. Fetch the 402 challenge.
  const challengeRes = await fetch(`${GATEWAY_URL}/c/${slug}`);
  if (challengeRes.status !== 402) {
    throw new Error(`Expected 402, got ${challengeRes.status}: ${await challengeRes.text()}`);
  }
  const challenge = (await challengeRes.json()) as { accepts: Requirement[] };
  const req = challenge.accepts[0];
  if (!req) throw new Error("Challenge had no payment requirements.");
  console.log("Challenge:", JSON.stringify(req, null, 2));

  const usdc = new Asset(req.asset.code, req.asset.issuer);

  // 2. Build + sign the payment: builder leg (+ fee leg, if any).
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(payer.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(NETWORK),
  }).addOperation(
    Operation.payment({ destination: req.payTo, asset: usdc, amount: req.maxAmountRequired }),
  );
  if (req.fee) {
    builder.addOperation(
      Operation.payment({ destination: req.fee.payTo, asset: usdc, amount: req.fee.amount }),
    );
  }
  const tx = builder.setTimeout(120).build();
  tx.sign(payer);

  // 3. Encode the X-PAYMENT proof and retry the call.
  const header = Buffer.from(
    JSON.stringify({
      x402Version: 1,
      scheme: "exact",
      network: req.network,
      payload: { transaction: tx.toXDR() },
    }),
    "utf8",
  ).toString("base64");

  const paidRes = await fetch(`${GATEWAY_URL}/c/${slug}`, {
    method: "POST",
    headers: { "X-PAYMENT": header, "content-type": "application/json" },
    body: "{}",
  });

  console.log("\nStatus:", paidRes.status);
  console.log("Receipt:", paidRes.headers.get("x-payment-response"));
  console.log("Body:", await paidRes.text());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
