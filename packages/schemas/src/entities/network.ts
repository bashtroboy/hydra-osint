import { z } from 'zod';

/**
 * Zod schema for a BGP autonomous system network entity.
 */
export const networkEntitySchema = z
  .object({
    type: z.literal('network').describe('Entity type discriminator'),
    identifier: z
      .string()
      .trim()
      .min(1, 'ASN identifier must not be empty')
      .describe('Autonomous System Number as a string (e.g. "AS15169")'),
    name: z.string().trim().optional().describe('AS organization name'),
    country: z
      .string()
      .trim()
      .optional()
      .describe('Country of registration (ISO 3166-1 alpha-2)'),
  })
  .describe('BGP autonomous system network entity');

/** Network entity inferred from the Zod schema. */
export type NetworkEntity = z.infer<typeof networkEntitySchema>;
