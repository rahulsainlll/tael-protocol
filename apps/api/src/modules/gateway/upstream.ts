import { createHmac } from "crypto";
import { decryptSecret } from "@tael/database";
import { type ServableCapability } from "../capabilities/capability.repository";
import { env } from "../../env";

/** How long we wait on the upstream before giving up. */
const UPSTREAM_TIMEOUT_MS = 30_000;

/**
 * Basic SSRF guard: reject non-http(s) URLs and obviously-internal hosts. Mirrors
 * the publish-time check in the dashboard — defense in depth, since a capability's
 * upstream is verified once at publish but proxied here on every call.
 */
export function isBlockedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return true;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  const host = url.hostname;
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/** Hop-by-hop and payment headers we must not forward to the upstream. */
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "x-payment",
  "authorization",
]);

/** Join a base upstream URL with an operation path (empty path = the base). */
export function resolveUpstreamUrl(base: string, path: string): string {
  if (!path) return base;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/**
 * Substitute the `{payer}` token in a resolved upstream URL with the caller's
 * Stellar address, enabling per-caller capabilities (e.g. TrustLine's
 * `…/agent/{payer}/available-credit`). No token → returned unchanged, so every
 * existing capability behaves byte-for-byte as before. The address comes from
 * the settled payment (`receipt.payer`), so it can't be spoofed by the caller;
 * it's a base32 G-address (URL-safe), but we encode defensively.
 */
export function applyPayerToken(url: string, payer: string | undefined): string {
  if (!url.includes("{payer}")) return url;
  return url.replaceAll("{payer}", encodeURIComponent(payer ?? ""));
}

/**
 * Proxy the (already-paid) request to the capability's real upstream endpoint,
 * injecting the decrypted API key. Forwards the caller's method, body, and safe
 * headers; returns the upstream response verbatim. `targetUrl` is the resolved
 * endpoint (base URL, or base + the operation's path).
 */
export async function proxyToUpstream(
  capability: ServableCapability,
  request: Request,
  targetUrl: string = capability.upstreamUrl,
  agentAddress?: string,
): Promise<Response> {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  const auth = capability.upstreamAuth ?? { scheme: "bearer" };
  const secret = capability.upstreamSecretEnc
    ? decryptSecret(capability.upstreamSecretEnc)
    : undefined;

  if (secret) {
    if (auth.scheme === "bearer") {
      headers.set("authorization", `Bearer ${secret}`);
    } else if (auth.scheme === "header" && auth.header) {
      headers.set(auth.header, secret);
    }
  }

  if (auth.extraHeaders) {
    for (const [key, value] of Object.entries(auth.extraHeaders)) {
      headers.set(key, value);
    }
  }

  if (agentAddress) {
    headers.set("x-tael-agent", agentAddress);
    const partnerSecret = env.PARTNER_HMAC_SECRET;
    if (partnerSecret) {
      const ts = Date.now();
      const hmac = createHmac("sha256", partnerSecret);
      hmac.update(`${ts}.${agentAddress}`);
      const sig = hmac.digest("hex");

      headers.set("x-tael-timestamp", String(ts));
      headers.set("x-tael-agent-sig", sig);
    }
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  // Forward the caller's query string to the upstream (e.g. ?address=G…) so a
  // capability can read GET params. Only rewrite the URL when the caller sent a
  // query, so URLs without one are passed through byte-for-byte as before.
  let finalUrl = targetUrl;
  const callerQuery = new URL(request.url).searchParams;
  if ([...callerQuery.keys()].length > 0) {
    const merged = new URL(targetUrl);
    callerQuery.forEach((value, key) => merged.searchParams.set(key, value));
    finalUrl = merged.toString();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(finalUrl, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    // Re-emit as a fresh Response so the body is consumable by the SDK wrapper.
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}
