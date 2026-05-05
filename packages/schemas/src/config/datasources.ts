import { z } from 'zod';

/**
 * Zod schema for an individual collector configuration.
 */
export const collectorConfigSchema = z
  .object({
    enabled: z
      .boolean()
      .default(true)
      .describe('Whether this collector is active'),
    pollInterval: z
      .number()
      .int()
      .positive()
      .default(60_000)
      .describe('Polling interval in milliseconds'),
    timeout: z
      .number()
      .int()
      .positive()
      .default(30_000)
      .describe('Request timeout in milliseconds'),
    maxRetries: z
      .number()
      .int()
      .nonnegative()
      .default(3)
      .describe('Maximum number of retry attempts on failure'),
    retryDelay: z
      .number()
      .int()
      .nonnegative()
      .default(5_000)
      .describe('Delay between retries in milliseconds'),
    baseUrl: z
      .string()
      .url()
      .optional()
      .describe('Base URL of the external API'),
    apiKey: z
      .string()
      .min(1)
      .optional()
      .describe('API key for authenticated endpoints'),
  })
  .describe('Configuration for a single data collector');

/** Collector config inferred from the Zod schema. */
export type CollectorConfig = z.infer<typeof collectorConfigSchema>;

/**
 * Zod schema for the complete data sources configuration.
 */
export const dataSourcesConfigSchema = z
  .object({
    adsb: collectorConfigSchema
      .optional()
      .describe('ADS-B (OpenSky) collector configuration'),
    ais: collectorConfigSchema
      .optional()
      .describe('AIS vessel tracking collector configuration'),
    bgp: collectorConfigSchema
      .optional()
      .describe('BGP routing data collector configuration'),
    seismic: collectorConfigSchema
      .optional()
      .describe('USGS seismic data collector configuration'),
    rss: collectorConfigSchema
      .optional()
      .describe('RSS/Atom feed collector configuration'),
  })
  .describe('Top-level data sources configuration');

/** Data sources config inferred from the Zod schema. */
export type DataSourcesConfig = z.infer<typeof dataSourcesConfigSchema>;
