import type { CollectorConfig } from '../shared/types.js';

/** Configuration for the EiBi shortwave schedule importer. */
export interface EibiCollectorConfig extends CollectorConfig {
  /** URL of the EiBi CSV schedule file. */
  csvUrl: string;
  /** Field delimiter used in the CSV file. */
  delimiter: string;
}

/** Default EiBi collector configuration. */
export const DEFAULT_EIBI_CONFIG: EibiCollectorConfig = {
  name: 'eibi-collector',
  enabled: true,
  pollInterval: 86_400_000, // 24 hours — schedules don't change often
  csvUrl: 'https://www.eibi.de/csv/csv.csv',
  delimiter: ';',
} as const;

/**
 * Build an EiBi collector config from optional overrides.
 *
 * Environment variable `EIBI_CSV_URL` is applied when no explicit
 * `csvUrl` override is provided.
 *
 * @param overrides - Partial config to merge over defaults
 * @returns A complete {@link EibiCollectorConfig}
 */
export function createEibiConfig(
  overrides: Partial<EibiCollectorConfig> = {},
): EibiCollectorConfig {
  const config: EibiCollectorConfig = {
    ...DEFAULT_EIBI_CONFIG,
    ...overrides,
  };

  const csvUrl = process.env['EIBI_CSV_URL'];
  if (csvUrl && overrides.csvUrl === undefined) {
    config.csvUrl = csvUrl;
  }

  return config;
}
