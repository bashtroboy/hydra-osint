import { z } from 'zod';

/**
 * Zod schema for a single aircraft state vector from the OpenSky Network API.
 *
 * @see https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors
 */
export const openSkyStateSchema = z
  .object({
    icao24: z
      .string()
      .regex(/^[0-9a-f]{6}$/, 'Must be a lowercase 6-character ICAO hex address')
      .describe('ICAO 24-bit transponder address (lowercase hex)'),
    callsign: z
      .string()
      .trim()
      .nullable()
      .describe('Callsign (8 chars max), null if not received'),
    origin_country: z.string().describe('Country of origin'),
    time_position: z
      .number()
      .nullable()
      .describe('Unix timestamp of last position update, null if not available'),
    last_contact: z
      .number()
      .describe('Unix timestamp of last message received'),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .nullable()
      .describe('WGS-84 longitude in degrees'),
    latitude: z
      .number()
      .min(-90)
      .max(90)
      .nullable()
      .describe('WGS-84 latitude in degrees'),
    baro_altitude: z
      .number()
      .nullable()
      .describe('Barometric altitude in meters'),
    on_ground: z.boolean().describe('Whether the aircraft is on ground'),
    velocity: z
      .number()
      .nonnegative()
      .nullable()
      .describe('Ground speed in m/s'),
    true_track: z
      .number()
      .min(0)
      .max(360)
      .nullable()
      .describe('True track angle in degrees clockwise from north'),
    vertical_rate: z
      .number()
      .nullable()
      .describe('Vertical rate in m/s (positive = climbing)'),
    geo_altitude: z
      .number()
      .nullable()
      .describe('Geometric altitude in meters'),
    squawk: z
      .string()
      .nullable()
      .describe('Transponder squawk code'),
    spi: z.boolean().describe('Special Position Indicator flag'),
    position_source: z
      .number()
      .int()
      .min(0)
      .max(3)
      .describe('Source of position: 0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM'),
  })
  .describe('OpenSky Network aircraft state vector');

/** OpenSky state vector inferred from the Zod schema. */
export type OpenSkyState = z.infer<typeof openSkyStateSchema>;

/**
 * Zod schema for the OpenSky Network /states/all API response.
 */
export const openSkyResponseSchema = z
  .object({
    time: z.number().describe('Unix timestamp of the response'),
    states: z
      .array(openSkyStateSchema)
      .describe('Array of aircraft state vectors'),
  })
  .describe('OpenSky Network API response');

/** OpenSky API response inferred from the Zod schema. */
export type OpenSkyResponse = z.infer<typeof openSkyResponseSchema>;
