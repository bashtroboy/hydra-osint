import type { CollectorConfig } from '../shared/types.js';

/** Configuration for the OpenMHz trunked radio collector. */
export interface OpenmhzCollectorConfig extends CollectorConfig {
  /** Base URL of the OpenMHz API. Defaults to 'https://api.openmhz.com'. */
  apiUrl: string;
  /** List of system shortNames to monitor. */
  systems: string[];
  /** Maximum number of calls to fetch per request. Defaults to 100. */
  maxCalls: number;
}

/** Default OpenMHz collector configuration. */
export const DEFAULT_OPENMHZ_CONFIG: OpenmhzCollectorConfig = {
  name: 'openmhz-collector',
  enabled: true,
  pollInterval: 30_000,
  apiUrl: 'https://api.openmhz.com',
  systems: [],
  maxCalls: 100,
} as const;

/**
 * Build an OpenMHz collector config from environment variables and optional overrides.
 *
 * Environment variables:
 * - `OPENMHZ_API_URL` — API base URL override
 * - `OPENMHZ_SYSTEMS` — Comma-separated list of system shortNames to monitor
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete OpenmhzCollectorConfig
 */
export function createOpenmhzConfig(
  overrides: Partial<OpenmhzCollectorConfig> = {},
): OpenmhzCollectorConfig {
  const config: OpenmhzCollectorConfig = {
    ...DEFAULT_OPENMHZ_CONFIG,
    ...overrides,
  };

  const apiUrl = process.env['OPENMHZ_API_URL'];
  if (apiUrl) {
    config.apiUrl = apiUrl;
  }

  const systemsEnv = process.env['OPENMHZ_SYSTEMS'];
  if (config.systems.length === 0 && systemsEnv) {
    config.systems = systemsEnv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return config;
}
