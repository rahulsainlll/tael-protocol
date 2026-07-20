// Publish (or update) Tael's first-party capabilities to the marketplace using
// the SDK. Run after deploying this service:
//
//   TAEL_KEY=tael_live_… PAY_TO=G… CAPABILITIES_URL=https://… \
//     pnpm --filter capabilities publish:capabilities
//
// It upserts each capability defined below (by name): a first run publishes it,
// and every re-run UPDATES the live one in place. Re-running is safe — it never
// creates a duplicate and never resets a granted Verified badge.
import { Tael, TaelError, type PublishCapabilityInput } from "@tael/sdk";

const apiKey = process.env.TAEL_KEY;
const payTo = process.env.PAY_TO;
// Trim any trailing slash so operation paths (e.g. /stellar/balance) don't
// produce a double slash when appended to the upstream endpoint.
const endpoint = (process.env.CAPABILITIES_URL ?? "http://localhost:3004").replace(/\/+$/, "");

if (!apiKey || !payTo) {
  console.error("Set TAEL_KEY and PAY_TO (and CAPABILITIES_URL to the deployed service).");
  process.exit(1);
}

/** The first-party capabilities, as SDK publish manifests. Stellar-native, free. */
const CAPABILITIES: PublishCapabilityInput[] = [
  {
    name: "Stellar",
    kind: "api",
    description:
      "Read-only Stellar lookups for AI agents: account balances, account details, and settled transactions. Free.",
    endpoint,
    payTo,
    operations: [
      {
        name: "Balance",
        path: "/stellar/balance",
        method: "GET",
        price: "0",
        sampleRequest: "address=<stellar-account-address>",
        sampleResponse: `{ "address": "G…", "balances": [{ "asset": "XLM", "issuer": null, "balance": "100.5" }] }`,
      },
      {
        name: "Account",
        path: "/stellar/account",
        method: "GET",
        price: "0",
        sampleRequest: "address=<stellar-account-address>",
        sampleResponse: `{ "id": "G…", "sequence": "123", "homeDomain": null, "numTrustlines": 2 }`,
      },
      {
        name: "Transaction",
        path: "/stellar/tx",
        method: "GET",
        price: "0",
        sampleRequest: "hash=<64-hex-transaction-hash>",
        sampleResponse: `{ "hash": "…", "successful": true, "ledger": 1, "operationCount": 1 }`,
      },
    ],
    faqs: [
      {
        question: "Which network does this read from?",
        answer: "The Stellar network Tael is running on (testnet today).",
      },
      { question: "Is it free?", answer: "Yes, every operation is priced at 0." },
    ],
  },
];

const tael = new Tael({ apiKey });

// What we already publish, so a re-run updates in place instead of duplicating.
const owned = await tael.myCapabilities();

for (const manifest of CAPABILITIES) {
  try {
    const existing = owned.find((c) => c.name === manifest.name);
    if (existing) {
      const result = await tael.updateCapability(existing.id, manifest);
      console.log(`Updated "${manifest.name}" → ${result.slug}`);
      console.log(`  https://app.taelprotocol.xyz/marketplace/${result.slug}`);
      continue;
    }
    const result = await tael.publish(manifest);
    console.log(`Published "${manifest.name}" → ${result.slug} (${result.status})`);
    console.log(`  https://app.taelprotocol.xyz/marketplace/${result.slug}`);
  } catch (err) {
    if (err instanceof TaelError) {
      console.error(`Failed to publish "${manifest.name}": ${err.status} ${err.message}`);
    } else {
      console.error(`Failed to publish "${manifest.name}":`, err);
    }
    process.exitCode = 1;
  }
}
