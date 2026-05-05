import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { dataSources, type DatabaseClient } from '@hydra/database';
import { NotFoundError } from '@hydra/core';

/**
 * Registers data source routes.
 *
 * @param fastify - Fastify instance to register routes on
 * @param opts - Options containing the database client
 */
export async function sourceRoutes(
  fastify: FastifyInstance,
  opts: { db: DatabaseClient['db'] },
): Promise<void> {
  const { db } = opts;

  /**
   * GET /sources — list all configured data sources.
   */
  fastify.get('/sources', {
    schema: {
      description: 'List all data sources',
      tags: ['sources'],
    },
  }, async () => {
    const rows = await db
      .select()
      .from(dataSources)
      .orderBy(dataSources.name);

    return { success: true, data: rows };
  });

  /**
   * GET /sources/:id — retrieve a single data source by ID.
   */
  fastify.get<{
    Params: { id: string };
  }>('/sources/:id', {
    schema: {
      description: 'Get a data source by ID',
      tags: ['sources'],
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
      .from(dataSources)
      .where(eq(dataSources.id, id))
      .limit(1);

    const source = rows[0];
    if (!source) {
      throw new NotFoundError('DataSource', { id });
    }

    return { success: true, data: source };
  });
}
