// Reference fiat FX rates from a free, no-key public source. Non-Stellar on
// purpose: it shows Tael hosts any self-contained capability, not just chain
// reads. If the source ever needs a key, this becomes a third-party capability.

const FX_SOURCE = process.env.FX_SOURCE_URL ?? "https://open.er-api.com/v6/latest";

export interface Rates {
  base: string;
  rates: Record<string, number>;
  /** When the source last updated the rates (as reported upstream). */
  asOf: string;
}

interface FxResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

/** Latest rates for `base` (a 3-letter currency). Throws if the lookup fails. */
export async function getRates(base: string): Promise<Rates> {
  const res = await fetch(`${FX_SOURCE}/${base}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("fx source unavailable");
  const data = (await res.json()) as FxResponse;
  if (data.result !== "success") throw new Error("fx lookup failed");
  return { base: data.base_code, rates: data.rates, asOf: data.time_last_update_utc };
}
