import type { FastifyInstance } from 'fastify';
import { eq, count, desc } from 'drizzle-orm';
import { events, type DatabaseClient } from '@hydra/database';
import { NotFoundError } from '@hydra/core';

/**
 * Registers event routes.
 *
 * @param fastify - Fastify instance to register routes on
 * @param opts - Options containing the database client
 */
export async function eventRoutes(
  fastify: FastifyInstance,
  opts: { db: DatabaseClient['db'] },
): Promise<void> {
  const { db } = opts;

  /**
   * GET /events — list events with pagination and optional severity filter.
   */
  fastify.get<{
    Querystring: { page?: string; limit?: string; severity?: string; type?: string };
  }>('/events', {
    schema: {
      description: 'List intelligence events with pagination',
      tags: ['events'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          severity: { type: 'string', enum: ['info', 'low', 'medium', 'high', 'critical'] },
          type: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const page = Math.max(1, Number(request.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 20)));
    const severityFilter = request.query.severity;
    const offset = (page - 1) * limit;

    const whereClause = severityFilter
      ? eq(events.severity, severityFilter as typeof events.severity.enumValues[number])
      : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(events)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(events.startTime)),
      db
        .select({ total: count() })
        .from(events)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    // Map to frontend expected format
    const mappedRows = rows.map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      description: row.description ?? '',
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      entityIds: (row.metadata as { entityIds?: string[] })?.entityIds ?? [],
      timestamp: row.startTime?.toISOString() ?? new Date().toISOString(),
    }));

    return {
      success: true,
      data: mappedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  /**
   * GET /events/:id — retrieve a single event by its UUID.
   */
  fastify.get<{
    Params: { id: string };
  }>('/events/:id', {
    schema: {
      description: 'Get an event by ID',
      tags: ['events'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request) => {
    const { id } = request.params;

    const rows = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    const event = rows[0];
    if (!event) {
      throw new NotFoundError('Event', { id });
    }

    return { success: true, data: event };
  });
}
