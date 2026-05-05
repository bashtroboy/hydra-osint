import { z } from 'zod';

/**
 * Zod schema for an aircraft entity identified by ICAO 24-bit hex address.
 */
export const aircraftEntitySchema = z
  .object({
    type: z.literal('aircraft').describe('Entity type discriminator'),
    identifier: z
      .string()
      .regex(/^[0-9A-F]{6}$/i, 'Must be a 6-character ICAO hex address')
      .describe('ICAO 24-bit hex address (e.g. "A1B2C3")'),
    callsign: z
      .string()
      .trim()
      .optional()
      .describe('ATC callsign (e.g. "UAL123")'),
    registration: z
      .string()
      .trim()
      .optional()
      .describe('Tail registration (e.g. "N12345")'),
    aircraftType: z
      .string()
      .trim()
      .optional()
      .describe('ICAO aircraft type designator (e.g. "B738")'),
    originCountry: z
      .string()
      .trim()
      .optional()
      .describe('Country of registration'),
  })
  .describe('Aircraft entity identified by ICAO hex address');

/** Aircraft entity inferred from the Zod schema. */
export type AircraftEntity = z.infer<typeof aircraftEntitySchema>;
