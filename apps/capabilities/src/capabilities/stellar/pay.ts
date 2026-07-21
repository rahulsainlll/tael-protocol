// The Pay action: validate a USDC payment against Horizon and return an "action
// intent" for the caller's Card to sign + submit. This endpoint NEVER holds a
// key and never moves money — it only checks the payment can succeed (the
// destination exists and trusts USDC) and describes what to sign. The buy-side
// (a funded Tael Card) builds the transaction from these validated params, adds
// Tael's fee, signs once, and submits. See the dashboard runCapability action
// branch.

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const NETWORK = process.env.STELLAR_NETWORK === "mainnet" ? "stellar" : "stellar-testnet";
const USDC_ISSUER =
  process.env.USDC_ISSUER ?? "GBCDXWBEN7YMCBI3DPIWQ5QBGG2NE7G5REZLNJI2E57VVNVDQM7PF7RA";

export interface PayIntent {
  /** Discriminator the buy-side uses to switch into sign-and-submit mode. */
  tael_action: "pay";
  network: string;
  asset: "USDC";
  to: string;
  amount: string;
  memo?: string;
  summary: string;
}

interface HorizonBalance {
  asset_code?: string;
  asset_issuer?: string;
}

function short(a: string): string {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

/**
 * Validate a USDC payment and return the intent to sign. Throws with a caller-
 * facing message if the payment could not succeed on-chain.
 */
export async function buildPayIntent(
  to: string,
  amount: string,
  memo?: string,
): Promise<PayIntent> {
  const res = await fetch(`${HORIZON_URL}/accounts/${to}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("Destination account not found or not funded");
  const account = (await res.json()) as { balances?: HorizonBalance[] };
  const trustsUsdc = (account.balances ?? []).some(
    (b) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER,
  );
  if (!trustsUsdc) throw new Error("Destination has no USDC trustline");
  return {
    tael_action: "pay",
    network: NETWORK,
    asset: "USDC",
    to,
    amount,
    ...(memo ? { memo } : {}),
    summary: `Pay ${amount} USDC to ${short(to)}`,
  };
}
