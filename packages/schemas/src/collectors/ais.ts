import { z } from 'zod';

/**
 * Zod schema for an AIS position report (message types 1, 2, 3).
 */
export const aisPositionReportSchema = z
  .object({
    messageType: z
      .number()
      .int()
      .min(1)
      .max(3)
      .describe('AIS message type (1, 2, or 3)'),
    mmsi: z
      .string()
      .regex(/^\d{9}$/, 'Must be a 9-digit MMSI')
      .describe('Maritime Mobile Service Identity'),
    navigationStatus: z
      .number()
      .int()
      .min(0)
      .max(15)
      .optional()
      .describe('Navigation status (0-15 per ITU-R M.1371)'),
    rateOfTurn: z
      .number()
      .nullable()
      .optional()
      .describe('Rate of turn in degrees/min (null if not available)'),
    speedOverGround: z
      .number()
      .nonnegative()
      .nullable()
      .optional()
      .describe('Speed over ground in knots'),
    positionAccuracy: z
      .number()
      .int()
      .min(0)
      .max(1)
      .optional()
      .describe('Position accuracy: 0=low, 1=high'),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe('WGS-84 longitude in degrees'),
    latitude: z
      .number()
      .min(-90)
      .max(90)
      .describe('WGS-84 latitude in degrees'),
    courseOverGround: z
      .number()
      .min(0)
      .max(360)
      .nullable()
      .optional()
      .describe('Course over ground in degrees'),
    trueHeading: z
      .number()
      .int()
      .min(0)
      .max(359)
      .nullable()
      .optional()
      .describe('True heading in degrees (0-359)'),
    timestamp: z
      .number()
      .int()
      .min(0)
      .max(63)
      .optional()
      .describe('UTC second when the report was generated (0-59, 60-63 special)'),
    receivedAt: z
      .coerce
      .date()
      .optional()
      .describe('Timestamp when the message was received'),
  })
  .describe('AIS position report (message types 1, 2, 3)');

/** AIS position report inferred from the Zod schema. */
export type AisPositionReport = z.infer<typeof aisPositionReportSchema>;

/**
 * Zod schema for AIS static and voyage data (message type 5).
 */
export const aisStaticDataSchema = z
  .object({
    messageType: z
      .literal(5)
      .describe('AIS message type 5 (static and voyage data)'),
    mmsi: z
      .string()
      .regex(/^\d{9}$/, 'Must be a 9-digit MMSI')
      .describe('Maritime Mobile Service Identity'),
    imo: z.string().trim().optional().describe('IMO ship number'),
    callsign: z.string().trim().optional().describe('Radio callsign'),
    name: z.string().trim().optional().describe('Vessel name'),
    shipType: z
      .number()
      .int()
      .min(0)
      .max(99)
      .optional()
      .describe('Ship type (0-99 per AIS spec)'),
    dimensionToBow: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Distance from reference point to bow in meters'),
    dimensionToStern: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Distance from reference point to stern in meters'),
    dimensionToPort: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Distance from reference point to port in meters'),
    dimensionToStarboard: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Distance from reference point to starboard in meters'),
    draught: z
      .number()
      .nonnegative()
      .optional()
      .describe('Maximum present static draught in meters'),
    destination: z
      .string()
      .trim()
      .optional()
      .describe('Reported destination'),
    eta: z
      .coerce
      .date()
      .optional()
      .describe('Estimated time of arrival'),
    receivedAt: z
      .coerce
      .date()
      .optional()
      .describe('Timestamp when the message was received'),
  })
  .describe('AIS static and voyage data (message type 5)');

/** AIS static data inferred from the Zod schema. */
export type AisStaticData = z.infer<typeof aisStaticDataSchema>;
