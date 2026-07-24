// Thin, dependency-free reads against Stellar Horizon. Every Stellar operation is
// read-only and public, so a plain fetch is all we need. The network's Horizon
// URL comes from the environment, defaulting to testnet. Each operation file
// under ./operations/ uses one of these helpers.

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

/** A Stellar public key: `G` followed by 55 base32 characters. */
export function isStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value);
}

async function horizon(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${HORIZON_URL}${path}`, {
    headers: { accept: "application/json" },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export interface Balance {
  asset: string;
  issuer: string | null;
  balance: string;
}

/** Balances (XLM + every trusted asset) for an account. */
export async function getBalances(address: string): Promise<Balance[]> {
  const { ok, data } = await horizon(`/accounts/${address}`);
  if (!ok) throw new Error("account not found");
  const balances = (data as { balances?: HorizonBalance[] }).balances ?? [];
  return balances.map((b) => ({
    asset: b.asset_type === "native" ? "XLM" : (b.asset_code ?? "?"),
    issuer: b.asset_issuer ?? null,
    balance: b.balance,
  }));
}

/** Core account details: sequence, thresholds, signers, home domain, flags. */
export async function getAccount(address: string): Promise<unknown> {
  const { ok, data } = await horizon(`/accounts/${address}`);
  if (!ok) throw new Error("account not found");
  const a = data as HorizonAccount;
  return {
    id: a.id,
    sequence: a.sequence,
    subentryCount: a.subentry_count,
    homeDomain: a.home_domain ?? null,
    thresholds: a.thresholds,
    flags: a.flags,
    signers: a.signers,
    numTrustlines: (a.balances ?? []).filter((b) => b.asset_type !== "native").length,
  };
}

/** A settled transaction by its hash. */
export async function getTransaction(hash: string): Promise<unknown> {
  const { ok, data } = await horizon(`/transactions/${hash}`);
  if (!ok) throw new Error("transaction not found");
  const t = data as HorizonTx;
  return {
    hash: t.hash,
    ledger: t.ledger,
    successful: t.successful,
    createdAt: t.created_at,
    sourceAccount: t.source_account,
    feeCharged: t.fee_charged,
    operationCount: t.operation_count,
    memo: t.memo ?? null,
  };
}

export interface NetworkStatus {
  latestLedger: number;
  protocolVersion: number;
  baseFee: string;
  baseReserve: string;
  closedAt: string;
  hash: string;
}

/** Latest ledger + the network parameters an agent needs before it transacts. */
export async function getStatus(): Promise<NetworkStatus> {
  const { ok, data } = await horizon(`/ledgers?order=desc&limit=1`);
  if (!ok) throw new Error("horizon unavailable");
  const ledger = (data as { _embedded?: { records?: HorizonLedger[] } })._embedded?.records?.[0];
  if (!ledger) throw new Error("no ledger");
  return {
    latestLedger: ledger.sequence,
    protocolVersion: ledger.protocol_version,
    baseFee: String(ledger.base_fee_in_stroops),
    baseReserve: String(ledger.base_reserve_in_stroops),
    closedAt: ledger.closed_at,
    hash: ledger.hash,
  };
}

export interface Order {
  price: string;
  amount: string;
}
export interface Orderbook {
  selling: string;
  buying: string;
  bids: Order[];
  asks: Order[];
}

/** Turn `native` or `CODE:ISSUER` into Horizon's asset query params for a side. */
function assetParams(
  prefix: "selling" | "buying" | "base" | "counter",
  spec: string,
): Record<string, string> {
  if (spec === "native" || spec === "XLM") return { [`${prefix}_asset_type`]: "native" };
  const [code, issuer] = spec.split(":");
  if (!code || !issuer) throw new Error("bad asset");
  const type = code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12";
  return {
    [`${prefix}_asset_type`]: type,
    [`${prefix}_asset_code`]: code,
    [`${prefix}_asset_issuer`]: issuer,
  };
}

/** Top `limit` bids and asks for a pair. Throws "bad asset" on a malformed spec. */
export async function getOrderbook(
  selling: string,
  buying: string,
  limit: number,
): Promise<Orderbook> {
  const params = new URLSearchParams({
    ...assetParams("selling", selling),
    ...assetParams("buying", buying),
    limit: String(limit),
  });
  const { ok, data } = await horizon(`/order_book?${params}`);
  if (!ok) throw new Error("horizon unavailable");
  const book = data as { bids?: Order[]; asks?: Order[] };
  const trim = (o: Order): Order => ({ price: o.price, amount: o.amount });
  return {
    selling,
    buying,
    bids: (book.bids ?? []).map(trim),
    asks: (book.asks ?? []).map(trim),
  };
}

export interface Trade {
  id: string;
  ledgerCloseTime: string;
  baseAmount: string;
  counterAmount: string;
  baseIsSeller: boolean;
  price: { n: string; d: string } | null;
}

export interface TradesResult {
  base: string;
  counter: string;
  trades: Trade[];
}

interface HorizonTradeRecord {
  id: string;
  ledger_close_time: string;
  base_amount: string;
  counter_amount: string;
  base_is_seller: boolean;
  price?: {
    n: number | string;
    d: number | string;
  };
}

/** Recent executed trades for a pair. Throws "bad asset" on a malformed spec. */
export async function getTrades(
  base: string,
  counter: string,
  limit: number,
): Promise<TradesResult> {
  const params = new URLSearchParams({
    ...assetParams("base", base),
    ...assetParams("counter", counter),
    order: "desc",
    limit: String(limit),
  });
  const { ok, status, data } = await horizon(`/trades?${params}`);
  // Horizon returns 404 for a pair that simply has no trades (unlike the
  // orderbook, which returns 200 with empty arrays). Treat that as an empty
  // result, not an error — a valid pair with no market is a normal answer.
  if (!ok && status !== 404) throw new Error("horizon unavailable");

  const records =
    (data as { _embedded?: { records?: HorizonTradeRecord[] } })?._embedded?.records ?? [];

  const trades: Trade[] = records.map((t) => ({
    id: t.id,
    ledgerCloseTime: t.ledger_close_time,
    baseAmount: t.base_amount,
    counterAmount: t.counter_amount,
    baseIsSeller: t.base_is_seller,
    price: t.price ? { n: String(t.price.n), d: String(t.price.d) } : null,
  }));

  return {
    base,
    counter,
    trades,
  };
}

export interface AssetFlags {
  authRequired: boolean;
  authRevocable: boolean;
  authImmutable: boolean;
  authClawbackEnabled: boolean;
}

export interface AssetInfo {
  code: string;
  issuer: string;
  amount: string;
  numAccounts: number;
  flags: AssetFlags;
}

/** Supply, holders count, and flags for an issued asset. */
export async function getAssetInfo(code: string, issuer: string): Promise<AssetInfo> {
  const path = `/assets?asset_code=${encodeURIComponent(code)}&asset_issuer=${encodeURIComponent(issuer)}`;
  const { ok, data } = await horizon(path);
  if (!ok) throw new Error("Asset query failed");

  const records = (data as { _embedded?: { records?: HorizonAssetRecord[] } })?._embedded?.records;
  if (!records || records.length === 0) {
    throw new Error("Asset not found");
  }

  const r = records[0];
  if (!r) {
    throw new Error("Asset not found");
  }

  const amount = r.amount ?? r.balances?.authorized ?? "0";
  const numAccounts =
    r.num_accounts ??
    (r.accounts
      ? (r.accounts.authorized ?? 0) +
        (r.accounts.authorized_to_maintain_liabilities ?? 0) +
        (r.accounts.unauthorized ?? 0)
      : 0);

  return {
    code: r.asset_code,
    issuer: r.asset_issuer,
    amount,
    numAccounts,
    flags: {
      authRequired: Boolean(r.flags?.auth_required),
      authRevocable: Boolean(r.flags?.auth_revocable),
      authImmutable: Boolean(r.flags?.auth_immutable),
      authClawbackEnabled: Boolean(r.flags?.auth_clawback_enabled),
    },
  };
}

// --- Paid reads: quote, explain, portfolio ---------------------------------

/** Canonical asset spec for path queries: "native" or "CODE:ISSUER". */
function canonicalAsset(spec: string): string {
  if (spec === "native" || spec === "XLM") return "native";
  const [code, issuer] = spec.split(":");
  if (!code || !issuer) throw new Error("bad asset");
  return `${code}:${issuer}`;
}

/** Add a `<prefix>_asset_type/code/issuer` triple for a source-side asset. */
function sourceAssetParams(spec: string): Record<string, string> {
  if (spec === "native" || spec === "XLM") return { source_asset_type: "native" };
  const [code, issuer] = spec.split(":");
  if (!code || !issuer) throw new Error("bad asset");
  return {
    source_asset_type: code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
    source_asset_code: code,
    source_asset_issuer: issuer,
  };
}

export interface Quote {
  source: string;
  sourceAmount: string;
  dest: string;
  destAmount: string;
  /** The intermediate hops (asset codes) the best route passes through. */
  path: string[];
}

/**
 * Best strict-send quote: send exactly `amount` of `source`, receive `dest`.
 * Picks the route with the highest destination amount. Throws "no path" when no
 * route exists (thin liquidity), "bad asset" on a malformed spec.
 */
export async function getQuote(source: string, dest: string, amount: string): Promise<Quote> {
  const params = new URLSearchParams({
    ...sourceAssetParams(source),
    source_amount: amount,
    destination_assets: canonicalAsset(dest),
  });
  const { ok, data } = await horizon(`/paths/strict-send?${params}`);
  if (!ok) throw new Error("horizon unavailable");
  const records = (data as { _embedded?: { records?: HorizonPath[] } })._embedded?.records ?? [];
  const best = records.reduce<HorizonPath | null>(
    (b, r) => (!b || Number(r.destination_amount) > Number(b.destination_amount) ? r : b),
    null,
  );
  if (!best) throw new Error("no path");
  return {
    source,
    sourceAmount: best.source_amount,
    dest,
    destAmount: best.destination_amount,
    path: (best.path ?? []).map((p) => (p.asset_type === "native" ? "XLM" : (p.asset_code ?? "?"))),
  };
}

export interface ExplainedOp {
  type: string;
  summary: string;
}
export interface TxExplanation {
  hash: string;
  successful: boolean;
  createdAt: string;
  feeCharged: string;
  summary: string;
  operations: ExplainedOp[];
}

/** A short, human-readable form of a Stellar address: `GABC…WXYZ`. */
function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "someone";
}
function opAsset(type?: string, code?: string): string {
  return type === "native" ? "XLM" : (code ?? "an asset");
}

/** Turn one Horizon operation into a plain-English line. */
function explainOp(op: HorizonOp): ExplainedOp {
  switch (op.type) {
    case "payment":
      return {
        type: op.type,
        summary: `${shortAddr(op.from)} paid ${op.amount} ${opAsset(op.asset_type, op.asset_code)} to ${shortAddr(op.to)}`,
      };
    case "create_account":
      return {
        type: op.type,
        summary: `${shortAddr(op.funder)} created account ${shortAddr(op.account)} with ${op.starting_balance} XLM`,
      };
    case "path_payment_strict_send":
    case "path_payment_strict_receive":
      return {
        type: op.type,
        summary: `${shortAddr(op.from)} swapped ${op.source_amount ?? "?"} ${opAsset(op.source_asset_type, op.source_asset_code)} for ${op.amount} ${opAsset(op.asset_type, op.asset_code)} to ${shortAddr(op.to)}`,
      };
    case "change_trust":
      return {
        type: op.type,
        summary: `${shortAddr(op.trustor ?? op.source_account)} set a trustline for ${opAsset(op.asset_type, op.asset_code)}`,
      };
    case "manage_sell_offer":
    case "manage_buy_offer":
    case "create_passive_sell_offer":
      return { type: op.type, summary: `${shortAddr(op.source_account)} placed a DEX offer` };
    default:
      return {
        type: op.type,
        summary: `${shortAddr(op.source_account)} performed ${op.type.replace(/_/g, " ")}`,
      };
  }
}

/** Decode a settled transaction into a readable summary of what it did. */
export async function explainTransaction(hash: string): Promise<TxExplanation> {
  const tx = await horizon(`/transactions/${hash}`);
  if (!tx.ok) throw new Error("transaction not found");
  const t = tx.data as HorizonTx;
  const opsRes = await horizon(`/transactions/${hash}/operations?limit=50`);
  const records =
    (opsRes.data as { _embedded?: { records?: HorizonOp[] } })._embedded?.records ?? [];
  const operations = records.map(explainOp);
  const summary =
    `Transaction ${t.successful ? "succeeded" : "failed"} with ` +
    `${operations.length} operation${operations.length === 1 ? "" : "s"}` +
    (operations.length ? `: ${operations.map((o) => o.summary).join("; ")}.` : ".");
  return {
    hash: t.hash,
    successful: t.successful,
    createdAt: t.created_at,
    feeCharged: t.fee_charged,
    summary,
    operations,
  };
}

/** The USDC asset portfolio values are quoted in. Overridable per deployment. */
const USDC_ASSET =
  process.env.USDC_ASSET ?? "USDC:GBCDXWBEN7YMCBI3DPIWQ5QBGG2NE7G5REZLNJI2E57VVNVDQM7PF7RA";

export interface Holding {
  asset: string;
  issuer: string | null;
  balance: string;
  /** Value of this balance in USDC, or null if no route to USDC exists. */
  valueUsdc: string | null;
}
export interface Portfolio {
  address: string;
  holdings: Holding[];
  /** Sum of the priced holdings, in USDC. */
  totalUsdc: string;
}

/**
 * Value every balance in an account in USDC. USDC is counted directly; every
 * other asset is priced by quoting its full balance to USDC across the DEX
 * (so the value already reflects realisable liquidity). Assets with no route to
 * USDC are returned with `valueUsdc: null` and excluded from the total.
 */
export async function getPortfolio(address: string): Promise<Portfolio> {
  const balances = await getBalances(address);
  const [usdcCode, usdcIssuer] = USDC_ASSET.split(":");
  let total = 0;
  const holdings: Holding[] = [];
  for (const b of balances) {
    let valueUsdc: string | null;
    if (b.asset === usdcCode && b.issuer === usdcIssuer) {
      valueUsdc = b.balance;
    } else if (Number(b.balance) === 0) {
      valueUsdc = "0";
    } else {
      const spec = b.issuer ? `${b.asset}:${b.issuer}` : "native";
      try {
        valueUsdc = (await getQuote(spec, USDC_ASSET, b.balance)).destAmount;
      } catch {
        valueUsdc = null;
      }
    }
    if (valueUsdc !== null) total += Number(valueUsdc);
    holdings.push({ asset: b.asset, issuer: b.issuer, balance: b.balance, valueUsdc });
  }
  return { address, holdings, totalUsdc: total.toFixed(7) };
}

interface HorizonPath {
  source_amount: string;
  destination_amount: string;
  path?: { asset_type: string; asset_code?: string; asset_issuer?: string }[];
}
interface HorizonOp {
  type: string;
  source_account: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  funder?: string;
  account?: string;
  starting_balance?: string;
  source_amount?: string;
  source_asset_type?: string;
  source_asset_code?: string;
  trustor?: string;
}

interface HorizonBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}
interface HorizonAccount {
  id: string;
  sequence: string;
  subentry_count: number;
  home_domain?: string;
  thresholds: unknown;
  flags: unknown;
  signers: unknown;
  balances?: HorizonBalance[];
}
interface HorizonTx {
  hash: string;
  ledger: number;
  successful: boolean;
  created_at: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
  memo?: string;
}
interface HorizonLedger {
  sequence: number;
  hash: string;
  closed_at: string;
  protocol_version: number;
  base_fee_in_stroops: number;
  base_reserve_in_stroops: number;
}
interface HorizonAssetRecord {
  asset_code: string;
  asset_issuer: string;
  amount?: string;
  num_accounts?: number;
  balances?: {
    authorized?: string;
  };
  accounts?: {
    authorized?: number;
    authorized_to_maintain_liabilities?: number;
    unauthorized?: number;
  };
  flags?: {
    auth_required?: boolean;
    auth_revocable?: boolean;
    auth_immutable?: boolean;
    auth_clawback_enabled?: boolean;
  };
}

export interface PaymentItem {
  id: string;
  type: string;
  from: string | null;
  to: string | null;
  asset: string;
  amount: string;
  createdAt: string;
  transactionHash: string;
}

export interface AccountPaymentsResult {
  address: string;
  payments: PaymentItem[];
}

interface HorizonPaymentRecord {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  from?: string;
  to?: string;
  funder?: string;
  account?: string;
  into?: string;
  source_account?: string;
  amount?: string;
  starting_balance?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
}

/** Recent payments in/out of an account. */
export async function getPayments(address: string, limit: number): Promise<AccountPaymentsResult> {
  const { ok, data } = await horizon(`/accounts/${address}/payments?order=desc&limit=${limit}`);
  if (!ok) throw new Error("account not found");

  const records =
    (data as { _embedded?: { records?: HorizonPaymentRecord[] } })?._embedded?.records ?? [];

  const payments: PaymentItem[] = records.map((r) => ({
    id: r.id,
    type: r.type,
    from: r.from ?? r.funder ?? r.source_account ?? null,
    to: r.to ?? r.account ?? r.into ?? null,
    asset: r.asset_type === "native" ? "XLM" : (r.asset_code ?? "?"),
    amount: r.amount ?? r.starting_balance ?? "0",
    createdAt: r.created_at,
    transactionHash: r.transaction_hash,
  }));

  return {
    address,
    payments,
  };
}

export interface FeeStats {
  lastLedgerBaseFee: string;
  min: string;
  mode: string;
  p50: string;
  p90: string;
}

interface HorizonFeeStats {
  last_ledger_base_fee: string;
  fee_charged: {
    min: string;
    mode: string;
    p50: string;
    p90: string;
  };
}

/** Recommended base fee stats for the next ledger. */
export async function getFeeStats(): Promise<FeeStats> {
  const { ok, data } = await horizon("/fee_stats");
  if (!ok) throw new Error("horizon unavailable");
  const stats = data as HorizonFeeStats;
  return {
    lastLedgerBaseFee: stats.last_ledger_base_fee,
    min: stats.fee_charged.min,
    mode: stats.fee_charged.mode,
    p50: stats.fee_charged.p50,
    p90: stats.fee_charged.p90,
  };
}
