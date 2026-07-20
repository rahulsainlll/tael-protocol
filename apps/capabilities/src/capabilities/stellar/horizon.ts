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
  const { ok, data } = await horizon(`/trades?${params}`);
  if (!ok) throw new Error("horizon unavailable");

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
