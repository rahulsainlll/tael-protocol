import type { Operation } from "../../../types";
import { buildSwapIntent, SWAP_SYMBOLS, type SwapSymbol } from "../swap";

/**
 * GET /stellar/swap?from=XLM&to=USDC&amount=10 — an ACTION. It returns an intent
 * for the caller's Tael Card to sign and submit (trade `from` -> `to` on the DEX
 * from the card itself), not data. Free to call; the assets move when the Card
 * signs. Optional `slippage` is a percent (default 0.5) that sets the minimum the
 * card will accept. Safe to fetch — it only prices and describes the swap.
 */
export const operation: Operation = {
  name: "Swap",
  path: "/stellar/swap",
  method: "GET",
  price: "0",
  sampleRequest: "from=XLM&to=USDC&amount=10",
  sampleResponse: `{ "tael_action": "swap", "from": "XLM", "to": "USDC", "sendAmount": "10", "destMin": "2.4750000", "summary": "Swap 10 XLM to ~2.5 USDC (min 2.475)" }`,
  handler: async (c) => {
    const from = (c.req.query("from") ?? "").toUpperCase() as SwapSymbol;
    const to = (c.req.query("to") ?? "").toUpperCase() as SwapSymbol;
    const amount = c.req.query("amount") ?? "";
    const slippage = c.req.query("slippage"); // percent, e.g. "0.5"

    if (!SWAP_SYMBOLS.includes(from) || !SWAP_SYMBOLS.includes(to)) {
      return c.json({ error: `from and to must each be one of: ${SWAP_SYMBOLS.join(", ")}` }, 400);
    }
    if (from === to) {
      return c.json({ error: "from and to must be different assets" }, 400);
    }
    if (!(Number(amount) > 0)) {
      return c.json({ error: "Provide a positive amount to swap" }, 400);
    }
    // Stellar amounts carry at most 7 decimal places — reject early with a clear
    // message rather than let the signer throw an opaque error later.
    if (/\.\d{8,}$/.test(amount)) {
      return c.json({ error: "amount can have at most 7 decimal places" }, 400);
    }
    const pct = slippage === undefined ? 0.5 : Number(slippage);
    if (!(pct >= 0) || pct > 50) {
      return c.json({ error: "slippage must be a percent between 0 and 50" }, 400);
    }

    try {
      return c.json(await buildSwapIntent(from, to, amount, Math.round(pct * 100)));
    } catch (err) {
      return c.json(
        { error: err instanceof Error ? err.message : "Could not prepare the swap" },
        422,
      );
    }
  },
};
