import type { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { positions, type DatabaseClient } from '@hydra/database';

/**
 * Registers position query routes.
 *
 * @param fastify - Fastify instance to register routes on
 * @param opts - Options containing the database client
 */
export async function positionRoutes(
  fastify: FastifyInstance,
  opts: { db: DatabaseClient['db'] },
): Promise<void> {
  const { db } = opts;

  /**
   * GET /positions — list positions with optional filters.
   *
   * Supports filtering by entityId, bounding box (minLat, maxLat, minLon, maxLon),
   * and time range (start, end).
   */
  fastify.get<{
    Querystring: {
      entityId?: string;
      minLat?: string;
      maxLat?: string;
      minLon?: string;
      maxLon?: string;
      start?: string;
      end?: string;
      limit?: string;
    };
  }>('/positions', {
    schema: {
      description: 'List positions with optional filters (entity, bbox, time range)',
      tags: ['positions'],
      querystring: {
        type: 'object',
        properties: {
          entityId: { type: 'string', format: 'uuid' },
          minLat: { type: 'string' },
          maxLat: { type: 'string' },
          minLon: { type: 'string' },
          maxLon: { type: 'string' },
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
          limit: { type: 'string', default: '100' },
        },
      },
    },
  }, async (request) => {
    const {
      entityId,
      minLat,
      maxLat,
      minLon,
      maxLon,
      start,
      end,
    } = request.query;
    const limit = Math.min(1000, Math.max(1, Number(request.query.limit ?? 100)));

    const conditions = [];

    if (entityId) {
      conditions.push(eq(positions.entityId, entityId));
    }
    if (minLat !== undefined) {
      conditions.push(gte(positions.latitude, Number(minLat)));
    }
    if (maxLat !== undefined) {
      conditions.push(lte(positions.latitude, Number(maxLat)));
    }
    if (minLon !== undefined) {
      conditions.push(gte(positions.longitude, Number(minLon)));
    }
    if (maxLon !== undefined) {
      conditions.push(lte(positions.longitude, Number(maxLon)));
    }
    if (start) {
      conditions.push(gte(positions.timestamp, new Date(start)));
    }
    if (end) {
      conditions.push(lte(positions.timestamp, new Date(end)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(positions)
      .where(whereClause)
      .orderBy(desc(positions.timestamp))
      .limit(limit);

    return { success: true, data: rows };
  });

  /**
   * GET /positions/latest — returns the most recent position for each entity.
   *
   * Uses a DISTINCT ON query to fetch one row per entity, ordered by timestamp
   * descending.
   */
  fastify.get('/positions/latest', {
    schema: {
      description: 'Get the latest position for each entity',
      tags: ['positions'],
    },
  }, async () => {
    const rows = await db
      .selectDistinctOn([positions.entityId])
      .from(positions)
      .orderBy(positions.entityId, desc(positions.timestamp));

    return { success: true, data: rows };
  });
}
