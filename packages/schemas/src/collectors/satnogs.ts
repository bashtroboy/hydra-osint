import { z } from 'zod';

/**
 * Zod schema for a SatNOGS satellite observation.
 *
 * @see https://db.satnogs.org/api/
 */
export const satnogsObservationSchema = z
  .object({
    id: z
      .number()
      .int()
      .describe('Unique observation identifier'),
    start: z
      .string()
      .describe('Observation start time (ISO-8601 UTC)'),
    end: z
      .string()
      .describe('Observation end time (ISO-8601 UTC)'),
    ground_station: z
      .number()
      .int()
      .describe('Ground station identifier'),
    transmitter: z
      .string()
      .nullable()
      .describe('Transmitter UUID, null if unknown'),
    norad_cat_id: z
      .number()
      .int()
      .describe('NORAD catalogue number of the satellite'),
    status: z
      .string()
      .describe('Observation status (e.g. "good", "bad", "unknown")'),
    waterfall: z
      .string()
      .nullable()
      .describe('URL to the waterfall image, null if unavailable'),
    demoddata: z
      .array(z.object({
        payload_demod: z.string().describe('URL to demodulated payload data'),
      }))
      .optional()
      .describe('Array of demodulated data payloads'),
    station_name: z
      .string()
      .optional()
      .describe('Human-readable name of the ground station'),
    station_lat: z
      .number()
      .min(-90)
      .max(90)
      .optional()
      .describe('Ground station latitude in degrees'),
    station_lng: z
      .number()
      .min(-180)
      .max(180)
      .optional()
      .describe('Ground station longitude in degrees'),
  })
  .describe('SatNOGS satellite observation record');

/** SatNOGS observation inferred from the Zod schema. */
export type SatnogsObservation = z.infer<typeof satnogsObservationSchema>;

/**
 * Zod schema for a SatNOGS satellite entry.
 *
 * @see https://db.satnogs.org/api/satellites/
 */
export const satnogsSatelliteSchema = z
  .object({
    norad_cat_id: z
      .number()
      .int()
      .describe('NORAD catalogue number'),
    name: z
      .string()
      .describe('Satellite name'),
    status: z
      .string()
      .describe('Operational status (e.g. "alive", "dead", "re-entered")'),
    decayed: z
      .coerce
      .date()
      .nullable()
      .optional()
      .describe('Date the satellite decayed, null if still in orbit'),
    launched: z
      .coerce
      .date()
      .nullable()
      .optional()
      .describe('Launch date'),
    deployed: z
      .coerce
      .date()
      .nullable()
      .optional()
      .describe('Deployment date'),
    image: z
      .string()
      .nullable()
      .optional()
      .describe('URL to satellite image'),
  })
  .describe('SatNOGS satellite catalogue entry');

/** SatNOGS satellite inferred from the Zod schema. */
export type SatnogsSatellite = z.infer<typeof satnogsSatelliteSchema>;

/**
 * Zod schema for a SatNOGS transmitter entry.
 *
 * @see https://db.satnogs.org/api/transmitters/
 */
export const satnogsTransmitterSchema = z
  .object({
    uuid: z
      .string()
      .describe('Unique transmitter UUID'),
    description: z
      .string()
      .describe('Human-readable transmitter description'),
    alive: z
      .boolean()
      .describe('Whether the transmitter is currently active'),
    type: z
      .string()
      .describe('Transmitter type (e.g. "Transceiver", "Transmitter")'),
    uplink_low: z
      .number()
      .nullable()
      .optional()
      .describe('Lower uplink frequency in Hz'),
    uplink_high: z
      .number()
      .nullable()
      .optional()
      .describe('Upper uplink frequency in Hz'),
    downlink_low: z
      .number()
      .nullable()
      .optional()
      .describe('Lower downlink frequency in Hz'),
    downlink_high: z
      .number()
      .nullable()
      .optional()
      .describe('Upper downlink frequency in Hz'),
    mode: z
      .string()
      .nullable()
      .optional()
      .describe('Modulation mode (e.g. "FM", "AFSK", "BPSK")'),
    baud: z
      .number()
      .nullable()
      .optional()
      .describe('Baud rate, null if not applicable'),
    norad_cat_id: z
      .number()
      .int()
      .describe('NORAD catalogue number of the parent satellite'),
  })
  .describe('SatNOGS satellite transmitter entry');

/** SatNOGS transmitter inferred from the Zod schema. */
export type SatnogsTransmitter = z.infer<typeof satnogsTransmitterSchema>;
