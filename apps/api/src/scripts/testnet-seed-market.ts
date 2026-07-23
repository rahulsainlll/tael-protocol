/**
 * TESTNET: seed an XLM/USDC market so the Swap action has something to route through.
 *
 * WHY THIS EXISTS
 * ---------------
 * Pay just sends USDC to an address, so it works on testnet with nothing but a
 * funded card + a trustline. Swap is different: it TRADES on the Stellar DEX, which
 * means it needs a live order book to route through. Public testnet has no XLM/USDC
 * market for our issuer, so a real swap has nowhere to go and correctly returns
 * `422 "no route"`. That is not a bug — there is simply no liquidity.
 *
 * Because our test USDC issuer (USDC_ISSUER) is one WE created (see testnet-setup.ts),
 * we can mint test USDC at will and stand up the market ourselves. This script:
 *
 *   1. creates (or reuses) a "market maker" account, funded with test XLM (friendbot)
 *   2. gives it a USDC trustline
 *   3. mints test USDC into it (the issuer signs — that's why ISSUER_SECRET is needed)
 *   4. posts two DEX offers so swaps route in BOTH directions:
 *        - sell USDC / buy XLM  -> lets XLM -> USDC swaps fill
 *        - sell XLM  / buy USDC -> lets USDC -> XLM swaps fill
 *   5. verifies a strict-send route now exists (the same query the Swap intent uses)
 *
 * After this runs, `GET /stellar/swap?from=XLM&to=USDC&amount=10` returns a real
 * intent instead of 422, and testnet-swap.ts can prove a swap on-chain end to end.
 *
 * The offers persist on testnet, so this is a one-time thing per issuer (re-running
 * just adds more depth from a fresh maker — harmless). Price is set near the real
 * XLM price (~$0.11) purely so the numbers read sensibly; testnet value is fake.
 *
 * Requires ISSUER_SECRET — the secret for the account in USDC_ISSUER, printed by
 * `testnet:setup`. Optional MAKER_SECRET reuses an existing maker instead of a new one.
 *
 * Run: ISSUER_SECRET=S... pnpm --filter @tael/api testnet:seed-market
 * Testnet only — no mainnet, no real funds.
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  type Transaction,
} from "@stellar/stellar-sdk";
import { networkPassphrase } from "@tael/stellar";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const passphrase = networkPassphrase("testnet");
const server = new Horizon.Server(HORIZON_URL);

// Roughly the real XLM price, so the seeded numbers read sensibly (testnet is fake).
const XLM_PRICE_USDC = "0.11"; // 1 XLM ≈ 0.11 USDC
const USDC_PER_XLM = XLM_PRICE_USDC; // price for the "sell XLM / buy USDC" offer
const XLM_PER_USDC = (1 / Number(XLM_PRICE_USDC)).toFixed(7); // for "sell USDC / buy XLM"

// How much depth to post. Generous, so ordinary demo-sized swaps fill in one hop.
const MINT_USDC = "500"; // mint this much USDC into the maker
const USDC_OFFER = "300"; // sell up to this much USDC for XLM
const XLM_OFFER = "3000"; // sell up to this much XLM for USDC

async function fund(pub: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(pub)}`);
  if (!res.ok) throw new Error(`friendbot failed: ${res.status} ${await res.text()}`);
}

async function submit(tx: Transaction, signer: Keypair, label: string): Promise<void> {
  tx.sign(signer);
  const res = await server.submitTransaction(tx);
  console.log(`  ${label} → ${res.hash}`);
}

async function hasUsdcTrustline(pub: string, issuer: string): Promise<boolean> {
  const account = await server.loadAccount(pub);
  return account.balances.some(
    (b) => "asset_code" in b && b.asset_code === "USDC" && b.asset_issuer === issuer,
  );
}

async function main(): Promise<void> {
  const issuerSecret = process.env.ISSUER_SECRET;
  if (!issuerSecret) {
    throw new Error("Set ISSUER_SECRET (the secret for USDC_ISSUER, printed by testnet:setup).");
  }
  const issuer = Keypair.fromSecret(issuerSecret);
  if (process.env.USDC_ISSUER && issuer.publicKey() !== process.env.USDC_ISSUER) {
    throw new Error(
      `ISSUER_SECRET is for ${issuer.publicKey()}, but USDC_ISSUER is ${process.env.USDC_ISSUER}. They must match.`,
    );
  }
  const usdc = new Asset("USDC", issuer.publicKey());
  const xlm = Asset.native();

  // 1. Maker: reuse MAKER_SECRET, or create + fund a fresh one.
  const isNewMaker = !process.env.MAKER_SECRET;
  const maker = process.env.MAKER_SECRET
    ? Keypair.fromSecret(process.env.MAKER_SECRET)
    : Keypair.random();
  console.log(`Market maker: ${maker.publicKey()}${isNewMaker ? " (new)" : " (reused)"}`);
  if (isNewMaker) {
    console.log("\nFunding maker via friendbot…");
    await fund(maker.publicKey());
  }

  // 2. USDC trustline on the maker (skip if it already trusts USDC).
  if (!(await hasUsdcTrustline(maker.publicKey(), issuer.publicKey()))) {
    console.log("\nAdding USDC trustline to maker…");
    const acct = await server.loadAccount(maker.publicKey());
    const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: passphrase })
      .addOperation(Operation.changeTrust({ asset: usdc }))
      .setTimeout(60)
      .build();
    await submit(tx, maker, "trustline");
  }

  // 3. Mint USDC into the maker (issuer signs).
  console.log(`\nMinting ${MINT_USDC} test USDC to maker…`);
  const issuerAcct = await server.loadAccount(issuer.publicKey());
  const mintTx = new TransactionBuilder(issuerAcct, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.payment({ destination: maker.publicKey(), asset: usdc, amount: MINT_USDC }),
    )
    .setTimeout(60)
    .build();
  await submit(mintTx, issuer, `mint ${MINT_USDC} USDC`);

  // 4. Post offers on both sides so strict-send routes either direction.
  console.log("\nPosting DEX offers (both directions)…");
  const makerAcct = await server.loadAccount(maker.publicKey());
  const offerTx = new TransactionBuilder(makerAcct, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    // sell USDC, buy XLM — makes XLM -> USDC swaps fill. price = XLM per USDC.
    .addOperation(
      Operation.manageSellOffer({
        selling: usdc,
        buying: xlm,
        amount: USDC_OFFER,
        price: XLM_PER_USDC,
      }),
    )
    // sell XLM, buy USDC — makes USDC -> XLM swaps fill. price = USDC per XLM.
    .addOperation(
      Operation.manageSellOffer({
        selling: xlm,
        buying: usdc,
        amount: XLM_OFFER,
        price: USDC_PER_XLM,
      }),
    )
    .setTimeout(60)
    .build();
  await submit(offerTx, maker, "two offers posted");

  // 5. Verify a route now exists (same query the Swap intent uses).
  console.log("\nVerifying a strict-send route (XLM -> USDC, 10 XLM)…");
  const params = new URLSearchParams({
    source_asset_type: "native",
    source_amount: "10",
    destination_assets: `USDC:${issuer.publicKey()}`,
  });
  const res = await fetch(`${HORIZON_URL}/paths/strict-send?${params}`);
  const data = (await res.json()) as {
    _embedded?: { records?: { destination_amount: string }[] };
  };
  const best = (data._embedded?.records ?? []).reduce<{ destination_amount: string } | null>(
    (b, r) => (!b || Number(r.destination_amount) > Number(b.destination_amount) ? r : b),
    null,
  );

  console.log("\n──────────────────────────────────────────────");
  if (best) {
    console.log(`MARKET SEEDED. 10 XLM now routes to ~${best.destination_amount} USDC.`);
  } else {
    console.log("Offers posted, but no route resolved yet — give Horizon a few seconds and retry.");
  }
  console.log(`\n  Maker address : ${maker.publicKey()}`);
  if (isNewMaker)
    console.log(`  Maker secret  : ${maker.secret()}  (testnet only; save to top up depth later)`);
  console.log(`  USDC issuer   : ${issuer.publicKey()}`);
  console.log("\nNext: prove a swap on-chain with");
  console.log("  pnpm --filter @tael/api swap:testnet");
  console.log("──────────────────────────────────────────────");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
