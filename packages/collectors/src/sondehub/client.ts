import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { fetchWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { SondehubCollectorConfig } from './config.js';
import type { SondehubTelemetry } from './types.js';

/**
 * Client for the SondeHub v2 REST API.
 *
 * Provides methods to fetch active radiosonde data with built-in
 * rate limiting and retry logic.
 *
 * @example
 * ```ts
 * const client = new SondehubClient(config);
 * const sondes = await client.fetchSondes();
 * ```
 */
export class SondehubClient {
  private readonly logger: Logger;
  private readonly apiUrl: string;
  private readonly defaultDuration: string;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * @param config - SondeHub collector configuration
   */
  constructor(config: SondehubCollectorConfig) {
    this.logger = createLogger({ name: 'sondehub-client' });
    this.apiUrl = config.apiUrl;
    this.defaultDuration = config.duration;

    // SondeHub is a community API — be conservative with 10 req/min
    this.rateLimiter = new TokenBucketRateLimiter(10, 60_000);
  }

  /**
   * Fetch all active sondes within the specified duration window.
   *
   * @param duration - How far back to query (e.g. '6h'). Defaults to config value.
   * @returns A record mapping sonde serial numbers to their latest telemetry
   * @throws {ExternalServiceError} When the API request fails after retries
   */
  async fetchSondes(
    duration?: string,
  ): Promise<Record<string, SondehubTelemetry>> {
    await this.rateLimiter.waitForToken();

    const dur = duration ?? this.defaultDuration;
    const url = `${this.apiUrl}/sondes?duration=${encodeURIComponent(dur)}`;

    this.logger.debug({ url, duration: dur }, 'Fetching active sondes');

    const data = await fetchWithRetry<Record<string, SondehubTelemetry>>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: { 'Accept': 'application/json' },
    });

    const count = Object.keys(data).length;
    this.logger.info({ count, duration: dur }, 'Fetched active sondes');

    return data;
  }

  /**
   * Fetch telemetry history for a specific sonde by serial number.
   *
   * @param serial   - The radiosonde serial number
   * @param duration - How far back to query (e.g. '6h'). Defaults to config value.
   * @returns Array of telemetry records ordered by time
   * @throws {ExternalServiceError} When the API request fails after retries
   */
  async fetchSondeData(
    serial: string,
    duration?: string,
  ): Promise<SondehubTelemetry[]> {
    await this.rateLimiter.waitForToken();

    const dur = duration ?? this.defaultDuration;
    const url = `${this.apiUrl}/sonde/${encodeURIComponent(serial)}?duration=${encodeURIComponent(dur)}`;

    this.logger.debug({ url, serial, duration: dur }, 'Fetching sonde data');

    const data = await fetchWithRetry<SondehubTelemetry[]>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: { 'Accept': 'application/json' },
    });

    this.logger.info(
      { serial, records: data.length, duration: dur },
      'Fetched sonde telemetry',
    );

    return data;
  }
}
