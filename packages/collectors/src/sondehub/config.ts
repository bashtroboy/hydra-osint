import type { CollectorConfig } from '../shared/types.js';

/** Configuration for the SondeHub radiosonde collector. */
export interface SondehubCollectorConfig extends CollectorConfig {
  /** Base URL of the SondeHub v2 API. */
  apiUrl: string;
  /** How far back to query for active sondes (e.g. '6h', '1d'). */
  duration: string;
  /** Number of position records to insert per database batch. Defaults to 500. */
  batchSize: number;
}

/** Default SondeHub collector configuration. */
export const DEFAULT_SONDEHUB_CONFIG: SondehubCollectorConfig = {
  name: 'sondehub-collector',
  enabled: true,
  pollInterval: 60_000,
  apiUrl: 'https://api.v2.sondehub.org',
  duration: '6h',
  batchSize: 500,
} as const;

/**
 * Build a SondeHub collector config from environment variables and optional overrides.
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete SondehubCollectorConfig
 */
export function createSondehubConfig(
  overrides: Partial<SondehubCollectorConfig> = {},
): SondehubCollectorConfig {
  const config: SondehubCollectorConfig = {
    ...DEFAULT_SONDEHUB_CONFIG,
    ...overrides,
  };

  const apiUrl = process.env['SONDEHUB_API_URL'];
  if (apiUrl) {
    config.apiUrl = apiUrl;
  }

  const duration = process.env['SONDEHUB_DURATION'];
  if (duration) {
    config.duration = duration;
  }

  return config;
}
