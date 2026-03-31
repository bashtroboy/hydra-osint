import type { FastifyInstance } from 'fastify';

/**
 * Registers health-check endpoints used by load balancers and orchestrators.
 *
 * @param fastify - Fastify instance to register routes on
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Liveness probe — returns 200 as long as the process is running.
   */
  fastify.get('/health/live', {
    schema: {
      description: 'Liveness probe',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return { status: 'ok' };
  });

  /**
   * Readiness probe — verifies downstream dependencies are reachable.
   * Currently returns a placeholder; will check database connectivity
   * once the database plugin is wired in.
   */
  fastify.get('/health/ready', {
    schema: {
      description: 'Readiness probe',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'string' },
              },
            },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    // TODO: Replace with real database ping once db plugin is registered
    const dbHealthy = true;

    const payload = {
      status: dbHealthy ? 'ok' : 'degraded',
      checks: {
        database: dbHealthy ? 'ok' : 'unreachable',
      },
    };

    return reply.status(dbHealthy ? 200 : 503).send(payload);
  });
}
