import { z } from 'zod';

/**
 * Zod schema for a SondeHub radiosonde telemetry report.
 *
 * @see https://github.com/projecthorus/sondehub-infra/wiki/API
 */
export const sondehubTelemetrySchema = z
  .object({
    serial: z
      .string()
      .describe('Radiosonde serial number'),
    datetime: z
      .string()
      .describe('Telemetry timestamp (ISO-8601 UTC)'),
    lat: z
      .number()
      .min(-90)
      .max(90)
      .describe('WGS-84 latitude in degrees'),
    lon: z
      .number()
      .min(-180)
      .max(180)
      .describe('WGS-84 longitude in degrees'),
    alt: z
      .number()
      .describe('Altitude in meters above sea level'),
    vel_h: z
      .number()
      .nullable()
      .optional()
      .describe('Horizontal velocity in m/s'),
    vel_v: z
      .number()
      .nullable()
      .optional()
      .describe('Vertical velocity in m/s (positive = ascending)'),
    heading: z
      .number()
      .min(0)
      .max(360)
      .nullable()
      .optional()
      .describe('Heading in degrees clockwise from north'),
    type: z
      .string()
      .nullable()
      .optional()
      .describe('Radiosonde type (e.g. "RS41", "DFM09", "M10")'),
    frequency: z
      .number()
      .nullable()
      .optional()
      .describe('Transmission frequency in MHz'),
    temp: z
      .number()
      .nullable()
      .optional()
      .describe('Temperature in degrees Celsius'),
    humidity: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .describe('Relative humidity as a percentage (0-100)'),
    pressure: z
      .number()
      .nullable()
      .optional()
      .describe('Atmospheric pressure in hPa'),
  })
  .describe('SondeHub radiosonde telemetry report');

/** SondeHub telemetry inferred from the Zod schema. */
export type SondehubTelemetry = z.infer<typeof sondehubTelemetrySchema>;
