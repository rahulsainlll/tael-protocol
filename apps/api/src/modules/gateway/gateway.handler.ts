import {
  buildPaymentRequirements,
  decodePaymentHeader,
  PAYMENT_REQUEST_HEADER,
  PAYMENT_RESPONSE_HEADER,
  settlePayment,
  splitFee,
  validatePayment,
  X402_VERSION,
} from "@tael/payments";
import { PaymentVerificationError } from "@tael/types";
import { type Container } from "../../container";
import { applyPayerToken, proxyToUpstream, isBlockedUrl, resolveUpstreamUrl } from "./upstream";
import { checkRateLimit } from "./rate-limit";
import { computeMeteredCost, readTokenUsage } from "./metered";
import { type ServableCapability } from "../capabilities/capability.repository";

/** The slice of the container the gateway needs. */
export type GatewayDeps = Pick<
  Container,
  "capabilities" | "payments" | "verifier" | "gateway" | "keys" | "limiter" | "idempotency"
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

  // Metered (usage-based) capability: call the upstream first, then bill by the
  // actual token usage. A different flow from x402's pay-first, handled here.
  if (capability.billing?.metered) {
    return handleMeteredCall(deps, capability, request, targetUrl);
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

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) {
    const entry = await deps.idempotency.get(idempotencyKey);
    if (entry) {
      if (entry.status === "in-flight") {
        return json({ error: "A request with this Idempotency-Key is already in progress." }, 409);
      }
      return new Response(entry.body, {
        status: entry.status,
        headers: entry.headers,
      });
    }
    await deps.idempotency.set(idempotencyKey, { status: "in-flight" });
  }

  let response: Response;
  try {
    response = await (async () => {
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
          return json(
            { error: "This API key has no Card linked. Link one to spend from it." },
            402,
          );
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

      // Build the x402 challenge requirements once (used for the 402 and to validate).
      const requirements = buildPaymentRequirements({
        price,
        payTo: capability.payTo,
        issuer: deps.gateway.issuer,
        network: deps.gateway.network,
        resource: new URL(servedRequest.url).pathname,
        description: capability.name,
        fee,
      });

      // No payment attached → return the 402 challenge.
      const paymentHeader = servedRequest.headers.get(PAYMENT_REQUEST_HEADER);
      if (!paymentHeader) {
        return json({ x402Version: X402_VERSION, accepts: [requirements] }, 402);
      }

      // Serve-then-settle: VALIDATE the payment (no on-chain submit), CALL the
      // upstream, and only SETTLE if the upstream succeeded. A failed capability is
      // therefore never charged — the signed transaction is simply never submitted.
      let validated;
      try {
        const payload = decodePaymentHeader(paymentHeader);
        validated = await validatePayment(payload, requirements, deps.verifier);
      } catch (error) {
        if (error instanceof PaymentVerificationError) {
          return json(
            { x402Version: X402_VERSION, accepts: [requirements], error: error.message },
            402,
          );
        }
        throw error;
      }

      // Substitute `{payer}` in the URL with the validated caller so per-caller
      // capabilities (e.g. TrustLine's `/agent/{payer}/available-credit`) hit the
      // right resource. No token → unchanged.
      const upstreamUrl = applyPayerToken(targetUrl, validated.payer);
      let upstream: Response;
      try {
        upstream = await proxyToUpstream(capability, servedRequest, upstreamUrl, validated.payer);
      } catch (error) {
        console.error("[gateway] upstream call failed:", error);
        return json({ error: "Upstream call failed" }, 502);
      }

      // The upstream failed → do NOT settle. Return its error untouched, unpaid.
      if (!upstream.ok) {
        return upstream;
      }

      // The call succeeded → settle the payment on-chain and record it.
      let receipt;
      try {
        receipt = await settlePayment(validated, deps.verifier);
      } catch (error) {
        console.error("[gateway] settlement failed after a successful call:", error);
        return json({ error: "Payment settlement failed. You were not charged." }, 402);
      }

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

      const headers = new Headers(upstream.headers);
      headers.set(
        PAYMENT_RESPONSE_HEADER,
        Buffer.from(JSON.stringify(receipt), "utf8").toString("base64"),
      );
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    })();
  } catch (error) {
    if (idempotencyKey) {
      await deps.idempotency.delete(idempotencyKey);
    }
    throw error;
  }

  if (idempotencyKey) {
    const hasReceipt = response.headers.has(PAYMENT_RESPONSE_HEADER);
    if (!hasReceipt) {
      await deps.idempotency.delete(idempotencyKey);
    } else {
      const bodyText = await response.clone().text();
      const headers: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headers[key] = val;
      });
      await deps.idempotency.set(idempotencyKey, {
        status: response.status,
        headers,
        body: bodyText,
      });
    }
  }

  return response;
}

/**
 * Serve a metered (usage-based) capability: authenticate the key, cap the
 * request to the configured max output tokens, call the upstream, then read the
 * token usage and compute the exact pass-through cost.
 *
 * STAGE A: the cost is computed and logged but NOT charged ($0) — this proves
 * the token-reading + math on real calls before any money moves. Stage B adds
 * the actual charge from the Card (pre-checked against its caps + balance).
 */
async function handleMeteredCall(
  deps: GatewayDeps,
  capability: ServableCapability,
  request: Request,
  targetUrl: string,
): Promise<Response> {
  const billing = capability.billing!;

  // Metered calls must be authenticated — we need a Card to bill (in Stage B).
  const bearer = parseTaelKey(request.headers.get("authorization"));
  if (!bearer) return json({ error: "This capability requires a Tael API key." }, 401);
  const key = await deps.keys.authorize(bearer);
  if (!key) return json({ error: "Invalid or revoked API key" }, 401);
  if (!key.card) {
    return json({ error: "This API key has no Card linked. Link one to spend from it." }, 402);
  }

  // Cap the request to our max output tokens so the cost stays bounded. We only
  // ever lower the caller's max_tokens, never raise it.
  let servedRequest = request;
  const method = request.method.toUpperCase();
  if (billing.maxTokens && method !== "GET" && method !== "HEAD") {
    try {
      const raw = await request.clone().text();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const asked = typeof parsed.max_tokens === "number" ? parsed.max_tokens : billing.maxTokens;
      parsed.max_tokens = Math.min(asked, billing.maxTokens);
      const headers = new Headers(request.headers);
      servedRequest = new Request(request, { headers, body: JSON.stringify(parsed) });
    } catch {
      // Body isn't JSON we can cap — proceed as-is; the upstream may still bound it.
    }
  }

  // Call the upstream first (call-then-charge), forwarding the paying Card id.
  let upstream: Response;
  try {
    upstream = await proxyToUpstream(capability, servedRequest, targetUrl, key.card.address);
  } catch (error) {
    console.error("[gateway] metered upstream call failed:", error);
    return json({ error: "Upstream call failed" }, 502);
  }

  // Read the full response to count tokens (metered calls are non-streaming).
  const bodyText = await upstream.text();
  const usage = readTokenUsage(bodyText);
  const model = billing.model ?? "";
  const cost = usage ? computeMeteredCost(model, usage) : null;

  // STAGE A: log the computed cost; do NOT charge. Stage B settles `cost` from
  // the Card (pre-checked against caps + balance) before returning.
  console.log(
    `[metered] ${capability.slug} card=${key.card.address} model=${model} ` +
      `usage=${JSON.stringify(usage)} cost=$${cost ?? "unknown"} (Stage A: not charged)`,
  );
  void deps.keys.touch(key.id).catch(() => {});

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  if (cost !== null) responseHeaders.set("x-tael-metered-cost", cost);
  if (usage) {
    responseHeaders.set("x-tael-input-tokens", String(usage.inputTokens));
    responseHeaders.set("x-tael-output-tokens", String(usage.outputTokens));
  }
  return new Response(bodyText, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
