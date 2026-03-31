import { z } from 'zod';

/**
 * Zod schema for pagination query parameters.
 */
export const paginationSchema = z
  .object({
    page: z
      .coerce
      .number()
      .int()
      .positive()
      .default(1)
      .describe('Page number (1-indexed)'),
    limit: z
      .coerce
      .number()
      .int()
      .positive()
      .max(100, 'Limit must not exceed 100')
      .default(20)
      .describe('Number of items per page (max 100)'),
  })
  .describe('Pagination query parameters');

/** Pagination parameters inferred from the Zod schema. */
export type Pagination = z.infer<typeof paginationSchema>;
