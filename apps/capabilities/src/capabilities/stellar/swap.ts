// The Swap action: quote a strict-send swap on the Stellar DEX and return an
// "action intent" for the caller's Card to sign + submit. Like Pay, this endpoint
// NEVER holds a key and never trades — it only prices the swap (best route + a
// slippage-protected minimum) and describes what to sign. The buy-side (a funded
// Tael Card) builds the path-payment transaction from these validated params, adds
// Tael's fee, signs once, and submits. See the dashboard runCapability action branch.

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const NETWORK = process.env.STELLAR_NETWORK === "mainnet" ? "stellar" : "stellar-testnet";
const USDC_ISSUER =
  process.env.USDC_ISSUER ?? "GBCDXWBEN7YMCBI3DPIWQ5QBGG2NE7G5REZLNJI2E57VVNVDQM7PF7RA";

/** The two assets v1 swaps between. Kept small on purpose — both have deep testnet liquidity. */
export type SwapSymbol = "XLM" | "USDC";
export const SWAP_SYMBOLS: SwapSymbol[] = ["XLM", "USDC"];

/** A Stellar asset in Horizon's wire shape (passes straight through to the signer). */
export interface HorizonAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface SwapIntent {
  /** Discriminator the buy-side uses to switch into sign-and-submit mode. */
  tael_action: "swap";
  network: string;
  from: SwapSymbol;
  to: SwapSymbol;
  send: HorizonAsset;
  sendAmount: string;
  dest: HorizonAsset;
  /** Minimum `to` the Card will accept — the slippage floor. */
  destMin: string;
  /** Best-route estimate at quote time (for display only; the tx is bounded by destMin). */
  estDest: string;
  /** Intermediate hops of the best route (empty for a direct market). */
  path: HorizonAsset[];
  slippageBps: number;
  summary: string;
}

interface HorizonPath {
  source_amount: string;
  destination_amount: string;
  path?: HorizonAsset[];
}

/** Resolve one of the supported symbols to its Horizon asset shape. */
function resolveAsset(sym: SwapSymbol): HorizonAsset {
  if (sym === "XLM") return { asset_type: "native" };
  return { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: USDC_ISSUER };
}

/** `source_asset_*` query params for the strict-send path lookup. */
function sourceParams(a: HorizonAsset): Record<string, string> {
  if (a.asset_type === "native") return { source_asset_type: "native" };
  return {
    source_asset_type: a.asset_type,
    source_asset_code: a.asset_code ?? "",
    source_asset_issuer: a.asset_issuer ?? "",
  };
}

/** `destination_assets` spec: "native" or "CODE:ISSUER". */
function destSpec(a: HorizonAsset): string {
  return a.asset_type === "native" ? "native" : `${a.asset_code}:${a.asset_issuer}`;
}

/** Collapse trailing zeros for a readable summary (e.g. "2.4750000" -> "2.475"). */
function trim(x: string): string {
  return String(Number(x));
}

/**
 * Price a swap and return the intent to sign. Finds the best strict-send route on
 * the DEX, then sets `destMin = estimate * (1 - slippage)` so the Card can never be
 * filled at a worse rate than it was shown. Throws with a caller-facing message if
 * no route exists (thin liquidity) or Horizon is unreachable.
 */
export async function buildSwapIntent(
  from: SwapSymbol,
  to: SwapSymbol,
  amount: string,
  slippageBps: number,
): Promise<SwapIntent> {
  const send = resolveAsset(from);
  const dest = resolveAsset(to);
  const params = new URLSearchParams({
    ...sourceParams(send),
    source_amount: amount,
    destination_assets: destSpec(dest),
  });
  const res = await fetch(`${HORIZON_URL}/paths/strict-send?${params}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("Could not reach the DEX to price this swap");
  const data = (await res.json()) as { _embedded?: { records?: HorizonPath[] } };
  const best = (data._embedded?.records ?? []).reduce<HorizonPath | null>(
    (b, r) => (!b || Number(r.destination_amount) > Number(b.destination_amount) ? r : b),
    null,
  );
  if (!best) throw new Error(`No route to swap ${from} to ${to} right now (thin liquidity)`);

  const estDest = best.destination_amount;
  const destMin = ((Number(estDest) * (10_000 - slippageBps)) / 10_000).toFixed(7);
  return {
    tael_action: "swap",
    network: NETWORK,
    from,
    to,
    send,
    sendAmount: amount,
    dest,
    destMin,
    estDest,
    path: best.path ?? [],
    slippageBps,
    summary: `Swap ${trim(amount)} ${from} to ~${trim(estDest)} ${to} (min ${trim(destMin)})`,
  };
}
