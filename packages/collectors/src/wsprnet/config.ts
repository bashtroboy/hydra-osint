import type { CollectorConfig } from '../shared/types.js';

/** Configuration for the WSPRnet data collector. */
export interface WsprnetCollectorConfig extends CollectorConfig {
  /** Base URL of the WSPRnet spots JSON endpoint. */
  apiUrl: string;
  /** Optional band filter (e.g. "20m", "40m"). */
  band?: string;
  /** Optional callsign filter to restrict results. */
  callsign?: string;
  /** Maximum number of spots to retrieve per request. */
  limit: number;
}

/** Default WSPRnet collector configuration. */
export const DEFAULT_WSPRNET_CONFIG: WsprnetCollectorConfig = {
  name: 'wsprnet-collector',
  enabled: true,
  pollInterval: 300_000, // 5 minutes
  apiUrl: 'https://www.wsprnet.org/drupal/wsprnet/spots/json',
  limit: 1000,
} as const;

/**
 * Build a WSPRnet collector config from optional overrides.
 *
 * Environment variable `WSPRNET_API_URL` is applied when no explicit
 * `apiUrl` override is provided.
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete {@link WsprnetCollectorConfig}
 */
export function createWsprnetConfig(
  overrides: Partial<WsprnetCollectorConfig> = {},
): WsprnetCollectorConfig {
  const config: WsprnetCollectorConfig = {
    ...DEFAULT_WSPRNET_CONFIG,
    ...overrides,
  };

  const apiUrl = process.env['WSPRNET_API_URL'];
  if (apiUrl && overrides.apiUrl === undefined) {
    config.apiUrl = apiUrl;
  }

  return config;
}
