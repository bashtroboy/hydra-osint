import { z } from 'zod';

/**
 * Zod schema for an EiBi (Eike Bierwirth) shortwave broadcast schedule entry.
 *
 * @see https://www.eibispace.de/
 */
export const eibiBroadcastSchema = z
  .object({
    frequency: z
      .number()
      .positive()
      .describe('Broadcast frequency in kHz'),
    timeStart: z
      .string()
      .describe('Broadcast start time in UTC (HHMM format)'),
    timeEnd: z
      .string()
      .describe('Broadcast end time in UTC (HHMM format)'),
    days: z
      .string()
      .optional()
      .describe('Days of operation (e.g. "1234567" for daily, "Mo-Fr" for weekdays)'),
    station: z
      .string()
      .describe('Broadcasting station name'),
    language: z
      .string()
      .describe('Language code of the broadcast (e.g. "E" for English, "G" for German)'),
    targetArea: z
      .string()
      .describe('Target reception area (e.g. "EEu" for Eastern Europe, "NAm" for North America)'),
    transmitterSite: z
      .string()
      .optional()
      .describe('Transmitter site location'),
  })
  .describe('EiBi shortwave broadcast schedule entry');

/** EiBi broadcast entry inferred from the Zod schema. */
export type EibiBroadcast = z.infer<typeof eibiBroadcastSchema>;
