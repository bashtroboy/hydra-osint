import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { fetchWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { SatnogsCollectorConfig } from './config.js';
import type {
  SatnogsSatellite,
  SatnogsTransmitter,
  SatnogsObservation,
} from './types.js';

/** Query parameters accepted by the SatNOGS satellites endpoint. */
export interface SatelliteQueryParams {
  /** Filter by satellite status (e.g. "alive", "dead"). */
  status?: string;
  /** Search by satellite name. */
  search?: string;
  /** Page number for paginated results. */
  page?: number;
}

/** Query parameters accepted by the SatNOGS transmitters endpoint. */
export interface TransmitterQueryParams {
  /** Filter by NORAD catalog ID. */
  satellite__norad_cat_id?: number;
  /** Filter by alive status. */
  alive?: boolean;
  /** Filter by transmitter type. */
  type?: string;
  /** Page number for paginated results. */
  page?: number;
}

/** Query parameters accepted by the SatNOGS observations endpoint. */
export interface ObservationQueryParams {
  /** Filter by NORAD catalog ID. */
  satellite__norad_cat_id?: number;
  /** Filter by ground station ID. */
  ground_station?: number;
  /** Filter by observation status. */
  status?: string;
  /** Page number for paginated results. */
  page?: number;
}

/**
 * Client for the SatNOGS DB and Network REST APIs.
 *
 * Handles authentication, rate limiting, pagination, and request construction
 * for fetching satellite, transmitter, and observation data.
 *
 * @example
 * ```ts
 * const client = new SatnogsClient(config);
 * const satellites = await client.fetchSatellites({ status: 'alive' });
 * const observations = await client.fetchRecentObservations();
 * ```
 */
export class SatnogsClient {
  private readonly logger: Logger;
  private readonly apiUrl: string;
  private readonly networkApiUrl: string;
  private readonly apiToken?: string;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * @param config - SatNOGS collector configuration
   */
  constructor(config: SatnogsCollectorConfig) {
    this.logger = createLogger({ name: 'satnogs-client' });
    this.apiUrl = config.apiUrl;
    this.networkApiUrl = config.networkApiUrl;
    this.apiToken = config.apiToken;

    // SatNOGS API: conservative rate limit of 20 requests per minute
    this.rateLimiter = new TokenBucketRateLimiter(20, 60_000);
  }

  /**
   * Fetch satellites from the SatNOGS DB API.
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Array of satellite records
   * @throws {ExternalServiceError} When the API request fails after retries
   */
  async fetchSatellites(params?: SatelliteQueryParams): Promise<SatnogsSatellite[]> {
    await this.rateLimiter.waitForToken();

    const url = this.buildUrl(this.apiUrl, '/satellites/', params);
    this.logger.debug({ url }, 'Fetching SatNOGS satellites');

    const data = await fetchWithRetry<SatnogsSatellite[]>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: this.buildHeaders(),
    });

    this.logger.info({ count: data.length }, 'Fetched SatNOGS satellites');
    return data;
  }

  /**
   * Fetch transmitters from the SatNOGS DB API.
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Array of transmitter records
   * @throws {ExternalServiceError} When the API request fails after retries
   */
  async fetchTransmitters(params?: TransmitterQueryParams): Promise<SatnogsTransmitter[]> {
    await this.rateLimiter.waitForToken();

    const url = this.buildUrl(this.apiUrl, '/transmitters/', params);
    this.logger.debug({ url }, 'Fetching SatNOGS transmitters');

    const data = await fetchWithRetry<SatnogsTransmitter[]>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: this.buildHeaders(),
    });

    this.logger.info({ count: data.length }, 'Fetched SatNOGS transmitters');
    return data;
  }

  /**
   * Fetch recent observations from the SatNOGS Network API.
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Array of observation records
   * @throws {ExternalServiceError} When the API request fails after retries
   */
  async fetchRecentObservations(params?: ObservationQueryParams): Promise<SatnogsObservation[]> {
    await this.rateLimiter.waitForToken();

    const url = this.buildUrl(this.networkApiUrl, '/observations/', params);
    this.logger.debug({ url }, 'Fetching SatNOGS observations');

    const data = await fetchWithRetry<SatnogsObservation[]>(url, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: this.buildHeaders(),
    });

    this.logger.info({ count: data.length }, 'Fetched SatNOGS observations');
    return data;
  }

  /**
   * Build a full URL with query parameters from a base URL and path.
   *
   * @param baseUrl - API base URL
   * @param path    - Endpoint path
   * @param params  - Optional query parameters
   * @returns Complete URL string
   */
  private buildUrl(
    baseUrl: string,
    path: string,
    params?: SatelliteQueryParams | TransmitterQueryParams | ObservationQueryParams,
  ): string {
    const base = `${baseUrl}${path}`;

    if (!params) {
      return base;
    }

    const searchParams = new URLSearchParams();
    const entries = Object.entries(params) as [string, string | number | boolean | undefined][];
    for (const [key, value] of entries) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${base}?${queryString}` : base;
  }

  /**
   * Build HTTP headers, including Token auth if an API token is configured.
   *
   * @returns Headers record
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (this.apiToken) {
      headers['Authorization'] = `Token ${this.apiToken}`;
    }

    return headers;
  }
}
