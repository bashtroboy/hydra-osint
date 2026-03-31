import { z } from 'zod';

/**
 * Zod schema for a vessel entity identified by MMSI.
 */
export const vesselEntitySchema = z
  .object({
    type: z.literal('vessel').describe('Entity type discriminator'),
    identifier: z
      .string()
      .regex(/^\d{9}$/, 'Must be a 9-digit MMSI')
      .describe('Maritime Mobile Service Identity (9 digits)'),
    name: z.string().trim().optional().describe('Vessel name'),
    shipType: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('AIS ship type code (0-99)'),
    imo: z
      .string()
      .trim()
      .optional()
      .describe('IMO ship identification number'),
    callsign: z.string().trim().optional().describe('Radio callsign'),
    destination: z
      .string()
      .trim()
      .optional()
      .describe('Reported destination'),
  })
  .describe('Vessel entity identified by MMSI');

/** Vessel entity inferred from the Zod schema. */
export type VesselEntity = z.infer<typeof vesselEntitySchema>;
