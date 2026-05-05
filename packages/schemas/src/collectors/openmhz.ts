import { z } from 'zod';

/**
 * Zod schema for an OpenMHz radio call record.
 *
 * @see https://github.com/openmhz/trunk-server
 */
export const openmhzCallSchema = z
  .object({
    talkgroupNum: z
      .number()
      .int()
      .describe('Numeric talkgroup identifier'),
    talkgroupDescription: z
      .string()
      .optional()
      .describe('Human-readable talkgroup description'),
    shortName: z
      .string()
      .describe('Short name of the radio system'),
    freq: z
      .number()
      .describe('Frequency in Hz the call was recorded on'),
    startTime: z
      .coerce
      .date()
      .describe('Start time of the call'),
    stopTime: z
      .coerce
      .date()
      .describe('End time of the call'),
    len: z
      .number()
      .nonnegative()
      .describe('Duration of the call in seconds'),
    url: z
      .string()
      .describe('URL to the recorded audio file'),
    srcList: z
      .array(
        z.object({
          src: z.number().int().describe('Radio ID of the source unit'),
          time: z.coerce.date().describe('Timestamp when this source was active'),
          pos: z.number().optional().describe('Position within the call'),
          emergency: z.boolean().optional().describe('Whether the source declared an emergency'),
          signal_system: z.string().optional().describe('Signal system type'),
          tag: z.string().optional().describe('Tag or label for the source unit'),
        }),
      )
      .describe('List of source radio units that participated in the call'),
  })
  .describe('OpenMHz radio call record');

/** OpenMHz call inferred from the Zod schema. */
export type OpenmhzCall = z.infer<typeof openmhzCallSchema>;

/**
 * Zod schema for an OpenMHz trunked radio system.
 */
export const openmhzSystemSchema = z
  .object({
    name: z
      .string()
      .describe('Full system name'),
    shortName: z
      .string()
      .describe('Short system identifier used in API calls'),
    description: z
      .string()
      .optional()
      .describe('Human-readable system description'),
    systemType: z
      .string()
      .optional()
      .describe('Trunking system type (e.g. "p25", "smartnet", "dmr")'),
    city: z
      .string()
      .optional()
      .describe('City where the system operates'),
    state: z
      .string()
      .optional()
      .describe('State or province where the system operates'),
    county: z
      .string()
      .optional()
      .describe('County where the system operates'),
  })
  .describe('OpenMHz trunked radio system');

/** OpenMHz system inferred from the Zod schema. */
export type OpenmhzSystem = z.infer<typeof openmhzSystemSchema>;
