import { z } from 'zod';

/**
 * Creates a Zod schema for a successful API response wrapping the given data schema.
 *
 * @param dataSchema - Zod schema for the response data payload
 * @returns A Zod object schema with `success: true` and `data`
 */
export function apiSuccessSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: T;
}> {
  return z.object({
    success: z.literal(true).describe('Indicates a successful response'),
    data: dataSchema.describe('Response payload'),
  });
}

/**
 * Zod schema for an API error response.
 */
export const apiErrorSchema = z
  .object({
    success: z.literal(false).describe('Indicates an error response'),
    error: z.object({
      code: z.string().describe('Machine-readable error code'),
      message: z.string().describe('Human-readable error message'),
      details: z
        .record(z.unknown())
        .optional()
        .describe('Additional error context'),
    }),
    correlationId: z
      .string()
      .uuid()
      .optional()
      .describe('Request correlation ID for tracing'),
  })
  .describe('Standard API error response');

/** API error response inferred from the Zod schema. */
export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Creates a Zod schema for a paginated API response wrapping the given item schema.
 *
 * @param itemSchema - Zod schema for each item in the results array
 * @returns A Zod object schema with `success`, `data` (array), and `pagination` metadata
 */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: z.ZodArray<T>;
  pagination: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
  }>;
}> {
  return z.object({
    success: z.literal(true).describe('Indicates a successful response'),
    data: z.array(itemSchema).describe('Array of result items'),
    pagination: z
      .object({
        page: z.number().int().positive().describe('Current page number'),
        limit: z.number().int().positive().describe('Items per page'),
        total: z
          .number()
          .int()
          .nonnegative()
          .describe('Total number of matching items'),
        totalPages: z
          .number()
          .int()
          .nonnegative()
          .describe('Total number of pages'),
      })
      .describe('Pagination metadata'),
  });
}
