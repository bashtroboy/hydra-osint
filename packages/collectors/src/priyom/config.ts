import type { CollectorConfig } from '../shared/types.js';

/** Configuration for the Priyom numbers station collector. */
export interface PriyomCollectorConfig extends CollectorConfig {
  /** Base URL for Priyom.org. */
  baseUrl: string;
  /** URL for the station schedule page. */
  scheduleUrl: string;
}

/** Default Priyom collector configuration (1-hour poll interval). */
export const DEFAULT_PRIYOM_CONFIG: PriyomCollectorConfig = {
  name: 'priyom-collector',
  enabled: true,
  pollInterval: 3_600_000,
  baseUrl: 'https://priyom.org',
  scheduleUrl: 'https://priyom.org/number-stations/station-schedule',
} as const;

/**
 * Build a Priyom collector config from optional overrides.
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete PriyomCollectorConfig
 */
export function createPriyomConfig(
  overrides: Partial<PriyomCollectorConfig> = {},
): PriyomCollectorConfig {
  return {
    ...DEFAULT_PRIYOM_CONFIG,
    ...overrides,
  };
}
