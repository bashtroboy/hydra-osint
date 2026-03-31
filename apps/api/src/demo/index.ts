/**
 * HYDRA API - Demo Mode
 *
 * Starts the API server with in-memory sample data.
 * No PostgreSQL or Redis required.
 *
 * Usage: pnpm demo
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { DemoDatabase } from './demo-db.js';
import { registerDemoRoutes } from './demo-routes.js';
import {
  DEMO_ENTITIES,
  DEMO_POSITIONS,
  DEMO_EVENTS,
  DEMO_DATA_SOURCES,
} from './seed-data.js';

const PORT = Number(process.env['PORT'] ?? 3000);

const BANNER = `
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   HYDRA OSINT Platform — Demo Mode                   ║
║                                                      ║
║   No database required. In-memory sample data.       ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

Available endpoints:

  Health
    GET  /health/live              Liveness probe
    GET  /health/ready             Readiness probe

  Entities
    GET  /api/v1/entities          List entities (paginated)
    GET  /api/v1/entities/:id      Get entity by ID

  Positions
    GET  /api/v1/positions         List positions (filtered)
    GET  /api/v1/positions/latest  Latest position per entity

  Events
    GET  /api/v1/events            List events (paginated)

  Sources
    GET  /api/v1/sources           List data sources
    GET  /api/v1/sources/:id       Get data source by ID

  Stats
    GET  /api/v1/stats             Dashboard statistics

  Auth
    POST /api/v1/auth/login        Get demo token
    GET  /api/v1/auth/me           Demo user info

  Docs
    GET  /docs                     Swagger UI
`;

/**
 * Builds and starts the demo-mode Fastify server.
 *
 * Registers CORS, Helmet, Swagger, and all demo routes backed by
 * an in-memory {@link DemoDatabase}. Logs a startup banner listing
 * all available endpoints.
 */
async function main(): Promise<void> {
  const demoDb = new DemoDatabase({
    entities: [...DEMO_ENTITIES],
    positions: [...DEMO_POSITIONS],
    events: [...DEMO_EVENTS],
    dataSources: [...DEMO_DATA_SOURCES],
  });

  const fastify = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      transport: { target: 'pino-pretty' },
    },
    genReqId: () => crypto.randomUUID(),
  });

  // ── Plugins ───────────────────────────────────────────────────
  await fastify.register(cors, { origin: true });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'HYDRA OSINT API (Demo Mode)',
        description: 'Open Source Intelligence platform — running with in-memory sample data',
        version: '0.1.0-demo',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Demo server',
        },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // ── Routes ────────────────────────────────────────────────────
  registerDemoRoutes(fastify, demoDb);

  // ── Graceful shutdown ─────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    fastify.log.info({ signal }, 'Received shutdown signal, closing server');
    try {
      await fastify.close();
      process.exit(0);
    } catch (err) {
      fastify.log.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // ── Start listening ───────────────────────────────────────────
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(BANNER);
    console.log(`  Listening on http://localhost:${PORT}\n`);
  } catch (err) {
    fastify.log.fatal({ err }, 'Failed to start demo server');
    process.exit(1);
  }
}

void main();
