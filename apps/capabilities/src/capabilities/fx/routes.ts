import { Hono } from "hono";
import { getRates } from "./rates";

/** Read-only fiat FX rates. No secrets. */
export const routes = new Hono();

// GET /fx/rates?base=USD — reference rates for a base currency (defaults to USD).
routes.get("/fx/rates", async (c) => {
  const base = (c.req.query("base") ?? "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(base)) {
    return c.json({ error: "Provide a 3-letter currency code (e.g. USD)" }, 400);
  }
  try {
    return c.json(await getRates(base));
  } catch {
    return c.json({ error: "FX rates unavailable" }, 502);
  }
});
