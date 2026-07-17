import { tael } from "@tael/sdk";
import { PAYMENT_REQUEST_HEADER, splitFee } from "@tael/payments";
import { type Container } from "../../container";
import { proxyToUpstream, isBlockedUrl, resolveUpstreamUrl } from "./upstream";
import { checkRateLimit } from "./rate-limit";

/** The slice of the container the gateway needs. */
export type GatewayDeps = Pick<
  Container,
  "capabilities" | "payments" | "verifier" | "gateway" | "keys" | "limiter"
>;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Extract a Tael API key from an `Authorization: Bearer tael_live_…` header. */
function parseTaelKey(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(tael_live_[A-Za-z0-9]+)$/i.exec(header.trim());
  return match ? match[1]! : null;
}

/**
 * Serve the public discovery catalog: `GET /capabilities?q=&kind=&limit=`.
 * Lists public, verified capabilities with only the fields a buyer needs to
 * pick and call one — no upstream URLs, no secrets.
 */
export async function handleCatalogRequest(
  deps: Pick<GatewayDeps, "capabilities" | "limiter">,
  request: Request,
): Promise<Response> {
  const rateLimitResponse = await checkRateLimit(deps.limiter, request);
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const items = await deps.capabilities.listCatalog({
    q: url.searchParams.get("q") ?? undefined,
    kind: url.searchParams.get("kind") ?? undefined,
    limit: limitParam ? Number(limitParam) : undefined,
  });
  return json({ capabilities: items }, 200);
}

/**
 * Serve a capability over x402. Loads the capability, then hands the request to
 * the SDK's `tael()` wrapper: no payment → `402` challenge; valid payment →
 * verify, proxy to the real upstream, record the settled payment, and return the
 * result with an `X-PAYMENT-RESPONSE` receipt.
 *
 * Framework-agnostic on purpose (takes a `Request`, returns a `Response`) so it
 * mounts under Hono here but is trivially testable via `app.request(...)`.
 */
export async function handleGatewayRequest(
  deps: GatewayDeps,
  slug: string,
  request: Request,
  operationSlug?: string,
): Promise<Response> {
  const rateLimitResponse = await checkRateLimit(deps.limiter, request);
  if (rateLimitResponse) return rateLimitResponse;

  const capability = await deps.capabilities.findServableBySlug(slug);
  if (!capability) {
    return json({ error: "Capability not found" }, 404);
  }

  // Resolve the operation (if any): its own price and upstream path. A capability
  // can expose many priced operations at `/c/<slug>/<op>`; `/c/<slug>` uses the
  // headline price and the base URL, exactly as before.
  let price = capability.price;
  let targetUrl = capability.upstreamUrl;
  if (operationSlug) {
    const operation = capability.operations.find((o) => o.slug === operationSlug);
    if (!operation) {
      return json({ error: "Operation not found" }, 404);
    }
    price = operation.price;
    targetUrl = resolveUpstreamUrl(capability.upstreamUrl, operation.path);
  }

  // Never take payment for a call we won't be able to make.
  if (isBlockedUrl(targetUrl)) {
    return json({ error: "Capability upstream is unavailable" }, 502);
  }

  // Free operation (price 0): no payment gate at all — just proxy and return.
  // Lets a capability mix free reads (balance, quote) with paid actions (swap).
  if (Number(price) <= 0) {
    try {
      return await proxyToUpstream(capability, request, targetUrl);
    } catch (error) {
      console.error("[gateway] free upstream call failed:", error);
      return json({ error: "Upstream call failed" }, 502);
    }
  }

  // Take the marketplace fee out of the price (non-custodial: it's paid directly
  // to Tael in the same tx). No fee address configured → builder keeps 100%.
  const fee =
    deps.gateway.feeAddress && deps.gateway.feeBps > 0
      ? { payTo: deps.gateway.feeAddress, bps: deps.gateway.feeBps }
      : undefined;
  const split = splitFee(price, fee ? deps.gateway.feeBps : 0);

  // API-key path: when the caller sends a Tael key (and hasn't already attached
  // a signed payment), authenticate it and auto-pay from its linked Card, within
  // the Card's caps. The wallet/x402 path below still works with no key.
  let servedRequest = request;
  const bearer = parseTaelKey(request.headers.get("authorization"));
  if (bearer && !request.headers.has(PAYMENT_REQUEST_HEADER)) {
    const key = await deps.keys.authorize(bearer);
    if (!key) return json({ error: "Invalid or revoked API key" }, 401);
    if (!key.card) {
      return json({ error: "This API key has no Card linked. Link one to spend from it." }, 402);
    }

    const legs = [{ to: capability.payTo, amount: split.net }];
    if (fee) legs.push({ to: fee.payTo, amount: split.fee });

    const payment = await deps.keys.payForCall({ card: key.card, total: price, legs });
    if (!payment.ok) return json({ error: payment.error }, payment.status);

    const headers = new Headers(request.headers);
    headers.set(PAYMENT_REQUEST_HEADER, payment.xPayment);
    servedRequest = new Request(request, { headers });
    void deps.keys.touch(key.id).catch(() => {});
  }

  const paid = tael({
    price,
    payTo: capability.payTo,
    issuer: deps.gateway.issuer,
    network: deps.gateway.network,
    verifier: deps.verifier,
    description: capability.name,
    fee,
    handler: async ({ request: paidRequest, receipt }) => {
      // The payment settled during verification — record it before doing the
      // work, so the ledger is correct even if the upstream then misbehaves.
      try {
        await deps.payments.recordSettled({
          capabilityId: capability.id,
          capabilityName: capability.name,
          payer: receipt.payer,
          payee: capability.payTo,
          amount: split.net,
          fee: split.fee,
          txHash: receipt.txHash,
        });
      } catch (error) {
        console.error("[gateway] failed to record payment:", error);
      }

      try {
        return await proxyToUpstream(capability, paidRequest, targetUrl);
      } catch (error) {
        console.error("[gateway] upstream call failed:", error);
        return json({ error: "Upstream call failed" }, 502);
      }
    },
  });

  return paid(servedRequest);
}
