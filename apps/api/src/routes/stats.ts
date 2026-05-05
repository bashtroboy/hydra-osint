import type { FastifyInstance } from 'fastify';
import { count, sql } from 'drizzle-orm';
import { entities, positions, events, dataSources, type DatabaseClient } from '@hydra/database';

/**
 * Registers stats/dashboard routes.
 *
 * @param fastify - Fastify instance to register routes on
 * @param opts - Options containing the database client
 */
export async function statsRoutes(
  fastify: FastifyInstance,
  opts: { db: DatabaseClient['db'] },
): Promise<void> {
  const { db } = opts;

  /**
   * GET /stats — dashboard statistics summary.
   */
  fastify.get('/stats', {
    schema: {
      description: 'Get dashboard statistics',
      tags: ['stats'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                entities: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    byType: { type: 'object' },
                  },
                },
                positions: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                  },
                },
                events: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    bySeverity: { type: 'object' },
                  },
                },
                sources: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    byStatus: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async () => {
    // Get entity counts by type
    const entityCountsResult = await db
      .select({
        type: entities.type,
        count: count(),
      })
      .from(entities)
      .groupBy(entities.type);

    const entitiesByType: Record<string, number> = {};
    let entitiesTotal = 0;
    for (const row of entityCountsResult) {
      entitiesByType[row.type] = row.count;
      entitiesTotal += row.count;
    }

    // Get position count
    const positionCountResult = await db
      .select({ total: count() })
      .from(positions);
    const positionsTotal = positionCountResult[0]?.total ?? 0;

    // Get event counts by severity
    const eventCountsResult = await db
      .select({
        severity: events.severity,
        count: count(),
      })
      .from(events)
      .groupBy(events.severity);

    const eventsBySeverity: Record<string, number> = {};
    let eventsTotal = 0;
    for (const row of eventCountsResult) {
      eventsBySeverity[row.severity] = row.count;
      eventsTotal += row.count;
    }

    // Get data source counts by status
    const sourceCountsResult = await db
      .select({
        status: dataSources.status,
        count: count(),
      })
      .from(dataSources)
      .groupBy(dataSources.status);

    const sourcesByStatus: Record<string, number> = {};
    let sourcesTotal = 0;
    for (const row of sourceCountsResult) {
      sourcesByStatus[row.status] = row.count;
      sourcesTotal += row.count;
    }

    return {
      success: true,
      data: {
        entities: {
          total: entitiesTotal,
          byType: entitiesByType,
        },
        positions: {
          total: positionsTotal,
        },
        events: {
          total: eventsTotal,
          bySeverity: eventsBySeverity,
        },
        sources: {
          total: sourcesTotal,
          byStatus: sourcesByStatus,
        },
      },
    };
  });
}
