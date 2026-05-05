import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createDatabase, type DatabaseClient } from '@hydra/database';
import { env } from './config/index.js';
import swaggerPlugin from './plugins/swagger.js';
import authPlugin from './plugins/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerRoutes } from './routes/index.js';

/** Options accepted by {@link buildApp}. */
export interface BuildAppOptions {
  /** Override Fastify server options (logger, etc.). */
  fastifyOpts?: FastifyServerOptions;
  /** Provide an existing database client instead of creating one. */
  database?: DatabaseClient;
}

/**
 * Creates, configures, and returns a Fastify instance with all plugins
 * and routes registered.
 *
 * @param opts - Optional overrides for the server and database configuration
 * @returns A fully-configured Fastify instance ready to listen
 *
 * @example
 * ```ts
 * const app = await buildApp();
 * await app.listen({ port: 3000, host: '0.0.0.0' });
 * ```
 */
export async function buildApp(opts?: BuildAppOptions): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty' },
      }),
    },
    genReqId: () => crypto.randomUUID(),
    ...opts?.fastifyOpts,
  });

  // ── Global hooks ──────────────────────────────────────────────────
  // Attach request ID to every response for tracing
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // ── Error handler ─────────────────────────────────────────────────
  fastify.setErrorHandler(errorHandler);

  // ── Plugins ───────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : true,
  });

  await fastify.register(helmet, {
    // Allow Swagger UI to load inline scripts/styles
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(swaggerPlugin);
  await fastify.register(authPlugin);

  // ── Database ──────────────────────────────────────────────────────
  const database = opts?.database ?? createDatabase(env.DATABASE_URL);

  // ── Routes ────────────────────────────────────────────────────────
  await registerRoutes(fastify, database.db);

  return fastify;
}
