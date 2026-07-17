import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type Container } from "./container";
import { handleCatalogRequest, handleGatewayRequest } from "./modules/gateway/gateway.handler";
import { createContextFactory } from "./trpc/context";
import { appRouter } from "./trpc/router";

/**
 * Build the Hono app from a container. Kept separate from `index.ts` (which
 * starts the listener) so tests can exercise the app via `app.request(...)`
 * without binding a port.
 */
export function createServer(container: Container) {
  const app = new Hono();

  app.use("*", cors());

  app.get("/health", (c) => c.json({ status: "ok", service: "tael-api" }));

  // Public discovery catalog: list/search verified capabilities (no secrets).
  // Lets the SDK do `tael.list()` / `tael.search(...)` and buyers browse.
  app.get("/capabilities", (c) => handleCatalogRequest(container, c.req.raw));

  // The capability gateway: agents call `/c/:slug` and pay per call over x402.
  // Public + unauthenticated by design — the payment *is* the authentication.
  // `/c/:slug/:operation` picks a specific priced operation of the capability.
  app.all("/c/:slug", (c) => handleGatewayRequest(container, c.req.param("slug"), c.req.raw));
  app.all("/c/:slug/:operation", (c) =>
    handleGatewayRequest(container, c.req.param("slug"), c.req.raw, c.req.param("operation")),
  );

  // Mount the tRPC router. The dashboard/SDK talk to this with full type safety.
  app.all("/trpc/*", (c) =>
    fetchRequestHandler({
      endpoint: "/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext: createContextFactory(container),
    }),
  );

  return app;
}
