import { createHash } from "crypto";

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds?: number;
}

/**
 * Port: RateLimiter interface.
 * Can be implemented by in-memory, Redis, or other backing stores.
 */
export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

/**
 * Derives a rate limit key for a given request.
 * Keys by hashed Tael API key if present, otherwise by the client IP address (X-Forwarded-For).
 */
export function getClientIdentifier(request: Request): string {
  // 1. Tael API Key
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = /^Bearer\s+(tael_live_[A-Za-z0-9]+)$/i.exec(authHeader.trim());
    if (match && match[1]) {
      // Key by SHA-256 of the token to avoid storing raw API keys in memory.
      const hash = createHash("sha256").update(match[1]).digest("hex");
      return `key_${hash}`;
    }
  }

  // 2. Client IP via X-Forwarded-For (first hop)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return `ip_${firstIp}`;
    }
  }

  // 3. Fallback for IP (CF-Connecting-IP)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return `ip_${cfConnectingIp.trim()}`;
  }

  return "ip_unknown";
}

/**
 * Adapter: Sliding window rate limiter implementation in memory.
 * NOTE: This is per-instance. A distributed rate limiter (e.g. using Redis) is a follow-up.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly requests = new Map<string, number[]>();

  constructor(
    public windowMs: number,
    public maxRequests: number,
  ) {
    // Prevent memory leaks in long-running processes (skip during unit tests)
    if (process.env.NODE_ENV !== "test") {
      const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }
  }

  /**
   * Clears the request memory and optionally updates configuration (useful for tests).
   */
  reset(windowMs?: number, maxRequests?: number) {
    this.requests.clear();
    if (windowMs !== undefined) this.windowMs = windowMs;
    if (maxRequests !== undefined) this.maxRequests = maxRequests;
  }

  /**
   * Check if a request should be limited.
   * If limited, returns true and the Retry-After seconds.
   * Otherwise, records the request timestamp and returns false.
   */
  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requests.get(key) || [];
    // Clean up timestamps outside the current window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldestInWindow = timestamps[0]!;
      const retryAfterMs = oldestInWindow + this.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      this.requests.set(key, timestamps);
      return { limited: true, retryAfterSeconds };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);
    return { limited: false };
  }

  /**
   * Cleans up keys with no active timestamps.
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests.entries()) {
      const active = timestamps.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
  }
}

/**
 * Lightweight check applied to the gateway requests using the injected limiter.
 * Returns a 429 response if limited, or null if allowed.
 */
export async function checkRateLimit(
  limiter: RateLimiter,
  request: Request,
): Promise<Response | null> {
  const key = getClientIdentifier(request);
  const result = await limiter.check(key);
  if (result.limited) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    });
  }
  return null;
}
