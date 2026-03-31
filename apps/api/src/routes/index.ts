import type { FastifyInstance } from 'fastify';
import type { DatabaseClient } from '@hydra/database';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { entityRoutes } from './entities.js';
import { positionRoutes } from './positions.js';
import { sourceRoutes } from './sources.js';

/**
 * Registers all route modules under the `/api/v1` prefix.
 *
 * @param fastify - Root Fastify instance
 * @param db - Drizzle database client used by data routes
 */
export async function registerRoutes(
  fastify: FastifyInstance,
  db: DatabaseClient['db'],
): Promise<void> {
  // Health checks are registered at the root level (no /api/v1 prefix)
  await fastify.register(healthRoutes);

  // All API routes live under /api/v1
  await fastify.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(entityRoutes, { db });
      await api.register(positionRoutes, { db });
      await api.register(sourceRoutes, { db });
    },
    { prefix: '/api/v1' },
  );
}
