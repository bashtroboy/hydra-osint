import type { CollectorConfig } from '../shared/types.js';

/** Configuration for the SatNOGS telemetry collector. */
export interface SatnogsCollectorConfig extends CollectorConfig {
  /** Base URL of the SatNOGS DB API. */
  apiUrl: string;
  /** Base URL of the SatNOGS Network API. */
  networkApiUrl: string;
  /** Optional API token for authenticated access. */
  apiToken?: string;
  /** Number of records to insert per database batch. Defaults to 500. */
  batchSize: number;
}

/** Default SatNOGS collector configuration. */
export const DEFAULT_SATNOGS_CONFIG: SatnogsCollectorConfig = {
  name: 'satnogs-collector',
  enabled: true,
  pollInterval: 120_000,
  apiUrl: 'https://db.satnogs.org/api',
  networkApiUrl: 'https://network.satnogs.org/api',
  batchSize: 500,
} as const;

/**
 * Build a SatNOGS collector config from environment variables and optional overrides.
 *
 * Reads the following environment variables:
 * - `SATNOGS_API_TOKEN` - Bearer token for authenticated API access
 * - `SATNOGS_API_URL`   - Override for the DB API base URL
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete SatnogsCollectorConfig
 */
export function createSatnogsConfig(
  overrides: Partial<SatnogsCollectorConfig> = {},
): SatnogsCollectorConfig {
  const config: SatnogsCollectorConfig = {
    ...DEFAULT_SATNOGS_CONFIG,
    ...overrides,
  };

  const apiToken = process.env['SATNOGS_API_TOKEN'];
  if (config.apiToken === undefined && apiToken) {
    config.apiToken = apiToken;
  }

  const apiUrl = process.env['SATNOGS_API_URL'];
  if (apiUrl) {
    config.apiUrl = apiUrl;
  }

  return config;
}
