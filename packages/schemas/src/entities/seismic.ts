import { z } from 'zod';

/**
 * Zod schema for a seismic event entity.
 */
export const seismicEntitySchema = z
  .object({
    type: z.literal('seismic').describe('Entity type discriminator'),
    identifier: z
      .string()
      .trim()
      .min(1, 'Seismic event identifier must not be empty')
      .describe('Unique event identifier (e.g. USGS event ID)'),
    magnitude: z
      .number()
      .describe('Event magnitude on the Richter scale'),
    depth: z
      .number()
      .nonnegative()
      .optional()
      .describe('Depth in kilometers below the surface'),
    place: z
      .string()
      .trim()
      .optional()
      .describe('Human-readable location description'),
  })
  .describe('Seismic event entity');

/** Seismic event entity inferred from the Zod schema. */
export type SeismicEntity = z.infer<typeof seismicEntitySchema>;
