import type { CollectorConfig } from '../shared/types.js';
import type { BBox } from '@hydra/core';

/** Credentials for authenticated OpenSky Network API access. */
export interface OpenSkyCredentials {
  /** OpenSky username */
  username: string;
  /** OpenSky password */
  password: string;
}

/** Configuration for the ADS-B collector. */
export interface AdsbCollectorConfig extends CollectorConfig {
  /** Base URL of the OpenSky Network API. */
  apiUrl: string;
  /** Optional credentials for higher rate limits. */
  credentials?: OpenSkyCredentials;
  /** Optional geographic bounding box to limit results. */
  boundingBox?: BBox;
  /** Number of position records to insert per database batch. Defaults to 500. */
  batchSize: number;
}

/** Default ADS-B collector configuration. */
export const DEFAULT_ADSB_CONFIG: AdsbCollectorConfig = {
  name: 'adsb-collector',
  enabled: true,
  pollInterval: 30_000,
  apiUrl: 'https://opensky-network.org/api',
  batchSize: 500,
} as const;

/**
 * Build an ADS-B collector config from environment variables and optional overrides.
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete AdsbCollectorConfig
 */
export function createAdsbConfig(
  overrides: Partial<AdsbCollectorConfig> = {},
): AdsbCollectorConfig {
  const config: AdsbCollectorConfig = {
    ...DEFAULT_ADSB_CONFIG,
    ...overrides,
  };

  // Apply env vars if no explicit credentials provided
  const username = process.env['OPENSKY_USERNAME'];
  const password = process.env['OPENSKY_PASSWORD'];
  if (config.credentials === undefined && username && password) {
    config.credentials = { username, password };
  }

  const apiUrl = process.env['OPENSKY_API_URL'];
  if (apiUrl) {
    config.apiUrl = apiUrl;
  }

  return config;
}
