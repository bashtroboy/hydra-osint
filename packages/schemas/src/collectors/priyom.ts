import { z } from 'zod';

/**
 * Zod schema for a Priyom numbers station record.
 *
 * @see https://priyom.org/number-stations
 */
export const priyomStationSchema = z
  .object({
    name: z
      .string()
      .describe('Human-readable station name (e.g. "The Buzzer")'),
    designator: z
      .string()
      .describe('ENIGMA / Priyom designator code (e.g. "E06", "V07")'),
    country: z
      .string()
      .optional()
      .describe('Country of suspected origin'),
    language: z
      .string()
      .optional()
      .describe('Language used in transmissions'),
    frequencies: z
      .array(z.number().positive())
      .describe('Known operating frequencies in kHz'),
    description: z
      .string()
      .optional()
      .describe('Brief description of the station and its characteristics'),
    status: z
      .enum(['active', 'inactive', 'unknown'])
      .optional()
      .describe('Current operational status'),
  })
  .describe('Priyom numbers station record');

/** Priyom station inferred from the Zod schema. */
export type PriyomStation = z.infer<typeof priyomStationSchema>;

/**
 * Zod schema for a Priyom numbers station schedule entry.
 */
export const priyomScheduleEntrySchema = z
  .object({
    stationName: z
      .string()
      .describe('Name of the station'),
    designator: z
      .string()
      .describe('ENIGMA / Priyom designator code'),
    frequency: z
      .number()
      .positive()
      .describe('Transmission frequency in kHz'),
    time: z
      .string()
      .describe('Scheduled transmission time in UTC'),
    dayOfWeek: z
      .string()
      .optional()
      .describe('Day of the week for recurring schedules'),
    notes: z
      .string()
      .optional()
      .describe('Additional notes about the schedule entry'),
  })
  .describe('Priyom numbers station schedule entry');

/** Priyom schedule entry inferred from the Zod schema. */
export type PriyomScheduleEntry = z.infer<typeof priyomScheduleEntrySchema>;
