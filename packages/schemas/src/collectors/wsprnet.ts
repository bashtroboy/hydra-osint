import { z } from 'zod';

/**
 * Zod schema for a WSPRnet (Weak Signal Propagation Reporter) spot record.
 *
 * @see https://wsprnet.org/drupal/
 */
export const wsprSpotSchema = z
  .object({
    Spotnum: z
      .number()
      .int()
      .describe('Unique spot record number'),
    Date: z
      .string()
      .describe('Spot date/time in UTC (YYYY-MM-DD HH:MM format)'),
    Reporter: z
      .string()
      .describe('Callsign of the reporting station'),
    ReporterGrid: z
      .string()
      .describe('Maidenhead grid locator of the reporter'),
    SNR: z
      .number()
      .int()
      .describe('Signal-to-noise ratio in dB'),
    Frequency: z
      .number()
      .describe('Transmission frequency in MHz'),
    CallSign: z
      .string()
      .describe('Callsign of the transmitting station'),
    Grid: z
      .string()
      .describe('Maidenhead grid locator of the transmitter'),
    Power: z
      .number()
      .describe('Transmitter power in dBm'),
    Drift: z
      .number()
      .int()
      .describe('Frequency drift in Hz'),
    Distance: z
      .number()
      .nonnegative()
      .describe('Distance between reporter and transmitter in km'),
    azimuth: z
      .number()
      .min(0)
      .max(360)
      .describe('Azimuth from reporter to transmitter in degrees'),
    Band: z
      .number()
      .describe('Band designation (e.g. 7 for 40m, 14 for 20m)'),
  })
  .describe('WSPRnet weak-signal propagation spot record');

/** WSPRnet spot inferred from the Zod schema. */
export type WsprSpot = z.infer<typeof wsprSpotSchema>;
