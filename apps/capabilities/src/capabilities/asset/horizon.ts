function getHorizonUrl(): string {
  return process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
}

/** A Stellar public key: `G` followed by 55 base32 characters. */
export function isStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value);
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

/** Supply, holders count, and flags for an issued asset. */
export async function getAssetInfo(code: string, issuer: string): Promise<AssetInfo> {
  const url = `${getHorizonUrl()}/assets?asset_code=${encodeURIComponent(code)}&asset_issuer=${encodeURIComponent(issuer)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("Asset query failed");

  const data = (await res.json()) as {
    _embedded?: {
      records?: HorizonAssetRecord[];
    };
  };

  const records = data._embedded?.records;
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
