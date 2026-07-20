// A Stellar DEX orderbook snapshot from Horizon. Read-only and public.
// Assets are given as `native` (XLM) or `CODE:ISSUER`.

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

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
function assetParams(prefix: "selling" | "buying", spec: string): Record<string, string> {
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

/** Top `limit` bids and asks for a pair. Throws on a malformed asset spec. */
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
  const res = await fetch(`${HORIZON_URL}/order_book?${params}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("horizon unavailable");
  const data = (await res.json()) as { bids?: Order[]; asks?: Order[] };
  const trim = (o: Order): Order => ({ price: o.price, amount: o.amount });
  return {
    selling,
    buying,
    bids: (data.bids ?? []).map(trim),
    asks: (data.asks ?? []).map(trim),
  };
}
