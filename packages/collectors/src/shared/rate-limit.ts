/**
 * Simple token-bucket rate limiter.
 *
 * Tracks requests within a sliding window and rejects requests when the
 * bucket is empty.
 *
 * @example
 * ```ts
 * const limiter = new TokenBucketRateLimiter(10, 60_000); // 10 req / min
 * if (limiter.tryConsume()) {
 *   await makeRequest();
 * }
 * ```
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillTimestamp: number;
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  /**
   * @param maxRequests - Maximum number of requests allowed in the window
   * @param windowMs   - Window duration in milliseconds
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxTokens = maxRequests;
    this.tokens = maxRequests;
    this.refillIntervalMs = windowMs;
    this.lastRefillTimestamp = Date.now();
  }

  /** Refill tokens based on elapsed time. */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTimestamp;

    if (elapsed >= this.refillIntervalMs) {
      this.tokens = this.maxTokens;
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Attempt to consume one token.
   *
   * @returns `true` if the request is allowed, `false` if rate-limited
   */
  tryConsume(): boolean {
    this.refill();

    if (this.tokens > 0) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Wait until a token becomes available, then consume it.
   *
   * @returns A promise that resolves when the request is allowed
   */
  async waitForToken(): Promise<void> {
    while (!this.tryConsume()) {
      const waitMs = this.refillIntervalMs - (Date.now() - this.lastRefillTimestamp);
      await new Promise((resolve) => {
        setTimeout(resolve, Math.max(waitMs, 100));
      });
    }
  }
}
