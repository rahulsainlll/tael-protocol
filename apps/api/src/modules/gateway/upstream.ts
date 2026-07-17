import { decryptSecret } from "@tael/database";
import { type ServableCapability } from "../capabilities/capability.repository";

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
 * Proxy the (already-paid) request to the capability's real upstream endpoint,
 * injecting the decrypted API key. Forwards the caller's method, body, and safe
 * headers; returns the upstream response verbatim. `targetUrl` is the resolved
 * endpoint (base URL, or base + the operation's path).
 */
export async function proxyToUpstream(
  capability: ServableCapability,
  request: Request,
  targetUrl: string = capability.upstreamUrl,
): Promise<Response> {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  if (capability.upstreamSecretEnc) {
    headers.set("authorization", `Bearer ${decryptSecret(capability.upstreamSecretEnc)}`);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: controller.signal,
    });
    // Re-emit as a fresh Response so the body is consumable by the SDK wrapper.
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } finally {
    clearTimeout(timer);
  }
}
