// Thin, dependency-free reads against Stellar Horizon. Every capability here is
// read-only and public, so a plain fetch is all we need. The network's Horizon
// URL comes from the environment, defaulting to testnet.

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
