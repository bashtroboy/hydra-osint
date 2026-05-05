import { z } from 'zod';

/**
 * Zod schema for a geographic bounding box query.
 */
export const bboxQuerySchema = z
  .object({
    minLat: z
      .coerce
      .number()
      .min(-90, 'Latitude must be >= -90')
      .max(90, 'Latitude must be <= 90')
      .describe('Southern boundary latitude'),
    maxLat: z
      .coerce
      .number()
      .min(-90, 'Latitude must be >= -90')
      .max(90, 'Latitude must be <= 90')
      .describe('Northern boundary latitude'),
    minLon: z
      .coerce
      .number()
      .min(-180, 'Longitude must be >= -180')
      .max(180, 'Longitude must be <= 180')
      .describe('Western boundary longitude'),
    maxLon: z
      .coerce
      .number()
      .min(-180, 'Longitude must be >= -180')
      .max(180, 'Longitude must be <= 180')
      .describe('Eastern boundary longitude'),
  })
  .refine((data) => data.minLat < data.maxLat, {
    message: 'minLat must be less than maxLat',
    path: ['minLat'],
  })
  .describe('Geographic bounding box query');

/** Bounding box query inferred from the Zod schema. */
export type BboxQuery = z.infer<typeof bboxQuerySchema>;

/**
 * Zod schema for a time range filter.
 */
export const timeRangeSchema = z
  .object({
    start: z
      .coerce
      .date()
      .describe('Start of the time range (ISO 8601 datetime)'),
    end: z
      .coerce
      .date()
      .optional()
      .describe('End of the time range (ISO 8601 datetime, defaults to now)'),
  })
  .refine(
    (data) => {
      if (data.end === undefined) return true;
      return data.start <= data.end;
    },
    {
      message: 'start must be before or equal to end',
      path: ['start'],
    },
  )
  .describe('Time range filter');

/** Time range inferred from the Zod schema. */
export type TimeRange = z.infer<typeof timeRangeSchema>;
