import { tael } from "@tael/sdk";
import { type Container } from "../../container";
import { proxyToUpstream, isBlockedUrl } from "./upstream";

/** The slice of the container the gateway needs. */
export type GatewayDeps = Pick<Container, "capabilities" | "payments" | "verifier" | "gateway">;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
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
): Promise<Response> {
  const capability = await deps.capabilities.findServableBySlug(slug);
  if (!capability) {
    return json({ error: "Capability not found" }, 404);
  }

  // Never take payment for a call we won't be able to make.
  if (isBlockedUrl(capability.upstreamUrl)) {
    return json({ error: "Capability upstream is unavailable" }, 502);
  }

  const paid = tael({
    price: capability.price,
    payTo: capability.payTo,
    issuer: deps.gateway.issuer,
    network: deps.gateway.network,
    verifier: deps.verifier,
    description: capability.name,
    handler: async ({ request: paidRequest, receipt }) => {
      // The payment settled during verification — record it before doing the
      // work, so the ledger is correct even if the upstream then misbehaves.
      try {
        await deps.payments.recordSettled({
          capabilityId: capability.id,
          payer: receipt.payer,
          payee: capability.payTo,
          amount: capability.price,
          txHash: receipt.txHash,
        });
      } catch (error) {
        console.error("[gateway] failed to record payment:", error);
      }

      try {
        return await proxyToUpstream(capability, paidRequest);
      } catch (error) {
        console.error("[gateway] upstream call failed:", error);
        return json({ error: "Upstream call failed" }, 502);
      }
    },
  });

  return paid(request);
}
