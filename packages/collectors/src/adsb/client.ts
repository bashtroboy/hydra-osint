import type { Logger } from 'pino';
import type { BBox } from '@hydra/core';
import { createLogger } from '@hydra/core';
import type { OpenSkyState } from '@hydra/schemas';
import { fetchWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { AdsbCollectorConfig, OpenSkyCredentials } from './config.js';
import type { OpenSkyRawResponse, OpenSkyRawStateVector } from './types.js';

/**
 * Client for the OpenSky Network REST API.
 *
 * Handles authentication, rate limiting, request construction,
 * and parsing of raw response arrays into typed state objects.
 *
 * @example
 * ```ts
 * const client = new OpenSkyClient(config);
 * const states = await client.fetchAllStates();
 * ```
 */
export class OpenSkyClient {
  private readonly logger: Logger;
  private readonly apiUrl: string;
  private readonly credentials?: OpenSkyCredentials;
  private readonly rateLimiter: TokenBucketRateLimiter;

  constructor(config: AdsbCollectorConfig) {
    this.logger = createLogger({ name: 'opensky-client' });
    this.apiUrl = config.apiUrl;
    this.credentials = config.credentials;

    // OpenSky anonymous: 10 req/min; authenticated: 40 req/min
    const maxRequests = this.credentials ? 40 : 10;
    this.rateLimiter = new TokenBucketRateLimiter(maxRequests, 60_000);
  }

  /**
   * Fetch all aircraft state vectors, optionally filtered by bounding box.
   *
   * @param bbox - Optional geographic bounding box to limit results
   * @returns Array of validated OpenSky state vectors
   * @throws {ExternalServiceError} When the API request fails
   */
  async fetchAllStates(bbox?: BBox): Promise<OpenSkyState[]> {
    await this.rateLimiter.waitForToken();

    const url = this.buildUrl(bbox);
    const headers = this.buildHeaders();

    this.logger.debug({ url, hasBbox: bbox !== undefined }, 'Fetching OpenSky states');

    const raw = await fetchWithRetry<OpenSkyRawResponse>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers,
    });

    if (!raw.states) {
      this.logger.info('OpenSky returned no states');
      return [];
    }

    const states = this.parseRawStates(raw.states);
    this.logger.info({ count: states.length }, 'Fetched OpenSky states');

    return states;
  }

  /**
   * Build the request URL including optional bounding box query parameters.
   *
   * @param bbox - Optional bounding box filter
   * @returns Complete URL string
   */
  private buildUrl(bbox?: BBox): string {
    const base = `${this.apiUrl}/states/all`;

    if (!bbox) {
      return base;
    }

    const params = new URLSearchParams({
      lamin: String(bbox.minLat),
      lomin: String(bbox.minLon),
      lamax: String(bbox.maxLat),
      lomax: String(bbox.maxLon),
    });

    return `${base}?${params.toString()}`;
  }

  /**
   * Build HTTP headers, including Basic auth if credentials are configured.
   *
   * @returns Headers record
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (this.credentials) {
      const encoded = Buffer.from(
        `${this.credentials.username}:${this.credentials.password}`,
      ).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    return headers;
  }

  /**
   * Parse raw positional arrays from the OpenSky API into typed state objects.
   *
   * Skips malformed entries and logs warnings rather than failing the entire batch.
   *
   * @param rawStates - Array of raw state vector arrays
   * @returns Array of parsed OpenSkyState objects
   */
  private parseRawStates(rawStates: OpenSkyRawStateVector[]): OpenSkyState[] {
    const parsed: OpenSkyState[] = [];

    for (const raw of rawStates) {
      try {
        if (!Array.isArray(raw) || raw.length < 17) {
          this.logger.warn({ raw }, 'Skipping malformed state vector');
          continue;
        }

        const state: OpenSkyState = {
          icao24: raw[0],
          callsign: raw[1] ? raw[1].trim() : null,
          origin_country: raw[2],
          time_position: raw[3],
          last_contact: raw[4],
          longitude: raw[5],
          latitude: raw[6],
          baro_altitude: raw[7],
          on_ground: raw[8],
          velocity: raw[9],
          true_track: raw[10],
          vertical_rate: raw[11],
          // raw[12] is sensors array — not part of our schema
          geo_altitude: raw[13],
          squawk: raw[14],
          spi: raw[15],
          position_source: raw[16],
        };

        parsed.push(state);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn({ error: message }, 'Failed to parse state vector');
      }
    }

    return parsed;
  }
}
