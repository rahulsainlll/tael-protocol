// The Stellar network's current state, read from Horizon's latest ledger.
// Read-only and public, so a plain fetch is all we need.

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

export interface NetworkStatus {
  /** Sequence number of the most recently closed ledger. */
  latestLedger: number;
  /** Protocol version the network is running. */
  protocolVersion: number;
  /** Base fee per operation, in stroops. */
  baseFee: string;
  /** Base reserve per entry, in stroops. */
  baseReserve: string;
  /** When the latest ledger closed (ISO 8601). */
  closedAt: string;
  /** Hash of the latest ledger. */
  hash: string;
}

interface HorizonLedger {
  sequence: number;
  hash: string;
  closed_at: string;
  protocol_version: number;
  base_fee_in_stroops: number;
  base_reserve_in_stroops: number;
}

/** Latest ledger + the network parameters an agent needs before it transacts. */
export async function getStatus(): Promise<NetworkStatus> {
  const res = await fetch(`${HORIZON_URL}/ledgers?order=desc&limit=1`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("horizon unavailable");
  const data = (await res.json()) as { _embedded?: { records?: HorizonLedger[] } };
  const ledger = data._embedded?.records?.[0];
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
