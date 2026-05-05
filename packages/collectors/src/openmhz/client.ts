import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { fetchWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { OpenmhzCollectorConfig } from './config.js';
import type { OpenmhzCall, OpenmhzSystem } from './types.js';

/** Optional query parameters for filtering calls. */
export interface FetchCallsParams {
  /** Filter by talkgroup number */
  talkgroup?: number;
  /** Filter calls after this ISO 8601 date */
  date?: string;
  /** Free-text filter string */
  filter?: string;
}

/**
 * API client for the OpenMHz trunked radio platform.
 *
 * Handles request construction, rate limiting, and response parsing
 * for the OpenMHz REST API.
 *
 * @example
 * ```ts
 * const client = new OpenmhzClient(config);
 * const systems = await client.fetchSystems();
 * const calls = await client.fetchCalls('chi_cfd');
 * ```
 */
export class OpenmhzClient {
  private readonly logger: Logger;
  private readonly apiUrl: string;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * @param config - OpenMHz collector configuration
   */
  constructor(config: OpenmhzCollectorConfig) {
    this.logger = createLogger({ name: 'openmhz-client' });
    this.apiUrl = config.apiUrl;

    // 20 requests per minute rate limit
    this.rateLimiter = new TokenBucketRateLimiter(20, 60_000);
  }

  /**
   * Fetch the list of all available trunked radio systems.
   *
   * @returns Array of registered OpenMHz systems
   * @throws {ExternalServiceError} When the API request fails
   */
  async fetchSystems(): Promise<OpenmhzSystem[]> {
    await this.rateLimiter.waitForToken();

    const url = `${this.apiUrl}/systems`;
    this.logger.debug({ url }, 'Fetching OpenMHz systems');

    const systems = await fetchWithRetry<OpenmhzSystem[]>(url, {
      timeoutMs: 15_000,
      maxAttempts: 3,
      headers: { 'Accept': 'application/json' },
    });

    this.logger.info({ count: systems.length }, 'Fetched OpenMHz systems');
    return systems;
  }

  /**
   * Fetch recent calls for a specific trunked radio system.
   *
   * @param system - System shortName to query
   * @param params - Optional query parameters for filtering
   * @returns Array of call records
   * @throws {ExternalServiceError} When the API request fails
   */
  async fetchCalls(
    system: string,
    params?: FetchCallsParams,
  ): Promise<OpenmhzCall[]> {
    await this.rateLimiter.waitForToken();

    const url = this.buildCallsUrl(system, params);
    this.logger.debug({ url, system }, 'Fetching OpenMHz calls');

    const calls = await fetchWithRetry<OpenmhzCall[]>(url, {
      timeoutMs: 15_000,
      maxAttempts: 3,
      headers: { 'Accept': 'application/json' },
    });

    this.logger.info(
      { system, count: calls.length },
      'Fetched OpenMHz calls',
    );

    return calls;
  }

  /**
   * Build the URL for a calls request with optional query parameters.
   *
   * @param system - System shortName
   * @param params - Optional filter parameters
   * @returns Complete URL string
   */
  private buildCallsUrl(system: string, params?: FetchCallsParams): string {
    const base = `${this.apiUrl}/${encodeURIComponent(system)}/calls`;

    if (!params) {
      return base;
    }

    const searchParams = new URLSearchParams();

    if (params.talkgroup !== undefined) {
      searchParams.set('talkgroup', String(params.talkgroup));
    }
    if (params.date !== undefined) {
      searchParams.set('date', params.date);
    }
    if (params.filter !== undefined) {
      searchParams.set('filter', params.filter);
    }

    const qs = searchParams.toString();
    return qs.length > 0 ? `${base}?${qs}` : base;
  }
}
