// Smoke-test the SDK publish flow against the live gateway.
//
//   TAEL_KEY=tael_live_xxx PAY_TO=G... node packages/sdk/examples/publish-test.mjs
//
// Needs a Tael API key (dashboard → API Keys) and your Stellar payout address.
// Publishes a throwaway capability, lists your capabilities, then unpublishes it.
import { Tael, TaelError } from "../dist/index.js";

const apiKey = process.env.TAEL_KEY;
const payTo = process.env.PAY_TO;
if (!apiKey || !payTo) {
  console.error("Set TAEL_KEY and PAY_TO env vars.");
  process.exit(1);
}

const tael = new Tael({ apiKey });

try {
  console.log("Publishing a test capability…");
  const cap = await tael.publish({
    name: `SDK Test ${Date.now()}`,
    kind: "api",
    description: "A throwaway capability published from the SDK to test the flow.",
    endpoint: "https://api.example.com/v1",
    payTo,
    operations: [{ name: "Ping", path: "/ping", method: "GET", price: "0" }],
    faqs: [{ question: "Is this real?", answer: "No, it is a publish smoke test." }],
  });
  console.log("  published:", cap); // { id, slug, status: "pending" }

  console.log("\nYour capabilities:");
  const mine = await tael.myCapabilities();
  for (const c of mine) console.log(`  ${c.status.padEnd(9)} ${c.slug}  (${c.kind})`);

  console.log("\nUnpublishing the test capability…");
  const removed = await tael.unpublish(cap.id);
  console.log("  removed:", removed);

  console.log("\n✅ Publish flow works end to end.");
} catch (err) {
  if (err instanceof TaelError) {
    console.error(`\n❌ TaelError ${err.status}: ${err.message}`);
    console.error("   body:", JSON.stringify(err.body));
  } else {
    console.error("\n❌ Failed:", err);
  }
  process.exit(1);
}
