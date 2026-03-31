import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { fetchWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { WsprnetCollectorConfig } from './config.js';
import type { WsprSpot } from './types.js';

/**
 * Client for the WSPRnet spots JSON API.
 *
 * Handles request construction, rate limiting (5 req/min to be gentle
 * with the community server), and response parsing.
 *
 * @example
 * ```ts
 * const client = new WsprnetClient(config);
 * const spots = await client.fetchRecentSpots();
 * ```
 */
export class WsprnetClient {
  private readonly logger: Logger;
  private readonly config: WsprnetCollectorConfig;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * @param config - WSPRnet collector configuration
   */
  constructor(config: WsprnetCollectorConfig) {
    this.logger = createLogger({ name: 'wsprnet-client' });
    this.config = config;
    // Be gentle with the community server: 5 requests per minute
    this.rateLimiter = new TokenBucketRateLimiter(5, 60_000);
  }

  /**
   * Fetch recent WSPR spots from the WSPRnet API.
   *
   * @param params - Optional query parameter overrides
   * @param params.band     - Band filter (e.g. "20m")
   * @param params.callsign - Callsign filter
   * @param params.count    - Maximum number of spots to return
   * @returns Array of WSPR spot records
   * @throws {ExternalServiceError} When the API request fails after retries
   */
  async fetchRecentSpots(params?: {
    band?: string;
    callsign?: string;
    count?: number;
  }): Promise<WsprSpot[]> {
    await this.rateLimiter.waitForToken();

    const url = this.buildUrl(params);
    this.logger.debug({ url }, 'Fetching WSPRnet spots');

    const spots = await fetchWithRetry<WsprSpot[]>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: { 'Accept': 'application/json' },
    });

    this.logger.info({ count: spots.length }, 'Fetched WSPRnet spots');
    return spots;
  }

  /**
   * Build the request URL with optional query parameters.
   *
   * @param params - Optional filter overrides
   * @returns Complete URL string
   */
  private buildUrl(params?: {
    band?: string;
    callsign?: string;
    count?: number;
  }): string {
    const queryParams = new URLSearchParams();

    const band = params?.band ?? this.config.band;
    if (band) {
      queryParams.set('band', band);
    }

    const callsign = params?.callsign ?? this.config.callsign;
    if (callsign) {
      queryParams.set('callsign', callsign);
    }

    const count = params?.count ?? this.config.limit;
    queryParams.set('count', String(count));

    const qs = queryParams.toString();
    return qs ? `${this.config.apiUrl}?${qs}` : this.config.apiUrl;
  }
}
