import type { FastifyInstance } from 'fastify';
import { eq, count } from 'drizzle-orm';
import { entities, type DatabaseClient } from '@hydra/database';
import { NotFoundError } from '@hydra/core';

/**
 * Registers entity CRUD routes.
 *
 * @param fastify - Fastify instance to register routes on
 * @param opts - Options containing the database client
 */
export async function entityRoutes(
  fastify: FastifyInstance,
  opts: { db: DatabaseClient['db'] },
): Promise<void> {
  const { db } = opts;

  /**
   * GET /entities — list entities with pagination and optional type filter.
   */
  fastify.get<{
    Querystring: { page?: string; limit?: string; type?: string };
  }>('/entities', {
    schema: {
      description: 'List tracked entities with pagination',
      tags: ['entities'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          type: { type: 'string', enum: ['aircraft', 'vessel', 'network', 'seismic'] },
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
    const typeFilter = request.query.type;
    const offset = (page - 1) * limit;

    const whereClause = typeFilter
      ? eq(entities.type, typeFilter as typeof entities.type.enumValues[number])
      : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(entities)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(entities.lastSeen),
      db
        .select({ total: count() })
        .from(entities)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  /**
   * GET /entities/:id — retrieve a single entity by its UUID.
   */
  fastify.get<{
    Params: { id: string };
  }>('/entities/:id', {
    schema: {
      description: 'Get an entity by ID',
      tags: ['entities'],
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
      .from(entities)
      .where(eq(entities.id, id))
      .limit(1);

    const entity = rows[0];
    if (!entity) {
      throw new NotFoundError('Entity', { id });
    }

    return { success: true, data: entity };
  });
}
