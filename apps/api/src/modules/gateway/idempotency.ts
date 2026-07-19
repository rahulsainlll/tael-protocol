export interface IdempotencyEntry {
  status: "in-flight" | number;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Port: IdempotencyStore interface.
 * Can be implemented by in-memory, Redis, or other backing stores.
 * Matches port+adapter pattern from rate-limit.ts.
 * Note: A Redis-backed store is the multi-instance follow-up.
 */
export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyEntry | null>;
  set(key: string, entry: IdempotencyEntry): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Adapter: In-memory idempotency store implementation.
 * NOTE: This is per-instance. A distributed idempotency store (e.g. using Redis) is a follow-up.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, { entry: IdempotencyEntry; expiresAt: number }>();

  constructor(public ttlMs: number) {
    // Prevent memory leaks in long-running processes (skip during unit tests)
    if (process.env.NODE_ENV !== "test") {
      const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }
  }

  async get(key: string): Promise<IdempotencyEntry | null> {
    const record = this.entries.get(key);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return record.entry;
  }

  async set(key: string, entry: IdempotencyEntry): Promise<void> {
    const expiresAt = Date.now() + this.ttlMs;
    this.entries.set(key, { entry, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  /**
   * Cleans up expired idempotency keys.
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.entries.entries()) {
      if (now > record.expiresAt) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Clears the entries (useful for resetting tests).
   */
  reset() {
    this.entries.clear();
  }
}
