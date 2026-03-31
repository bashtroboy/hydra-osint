import type { FastifyInstance } from 'fastify';
import type { DemoDatabase } from './demo-db.js';

/** Demo JWT token returned by the login endpoint. */
const DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJlbWFpbCI6ImRlbW9AaHlkcmEub3NpbnQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTE4NDQ4MDAsImV4cCI6OTk5OTk5OTk5OX0.demo';

/** Demo user returned by the /auth/me endpoint. */
const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@hydra.osint',
  role: 'admin',
} as const;

/**
 * Registers all demo routes on the Fastify instance.
 *
 * These routes mirror the real API routes but are backed by an in-memory
 * {@link DemoDatabase} instead of PostgreSQL.
 *
 * @param fastify - Fastify instance to register routes on
 * @param demoDb - In-memory demo database
 */
export function registerDemoRoutes(
  fastify: FastifyInstance,
  demoDb: DemoDatabase,
): void {
  // ── Health checks ───────────────────────────────────────────────

  fastify.get('/health/live', {
    schema: {
      description: 'Liveness probe (demo mode)',
      tags: ['health'],
    },
  }, async () => {
    return { status: 'ok', mode: 'demo' };
  });

  fastify.get('/health/ready', {
    schema: {
      description: 'Readiness probe (demo mode)',
      tags: ['health'],
    },
  }, async () => {
    return { status: 'ok', mode: 'demo', database: 'in-memory' };
  });

  // ── API v1 routes ───────────────────────────────────────────────

  fastify.register(async (api) => {

    // ── Auth ────────────────────────────────────────────────────

    api.post<{
      Body: { email: string; password: string };
    }>('/auth/login', {
      schema: {
        description: 'Authenticate and receive a JWT (demo mode)',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    }, async () => {
      return {
        success: true,
        data: { token: DEMO_TOKEN },
      };
    });

    api.get('/auth/me', {
      schema: {
        description: 'Get current authenticated user info (demo mode)',
        tags: ['auth'],
      },
    }, async () => {
      return {
        success: true,
        data: DEMO_USER,
      };
    });

    // ── Entities ────────────────────────────────────────────────

    api.get<{
      Querystring: { page?: string; limit?: string; type?: string };
    }>('/entities', {
      schema: {
        description: 'List tracked entities with pagination (demo mode)',
        tags: ['entities'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1' },
            limit: { type: 'string', default: '20' },
            type: { type: 'string', enum: ['aircraft', 'vessel', 'network', 'seismic'] },
          },
        },
      },
    }, async (request) => {
      const page = Math.max(1, Number(request.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 20)));

      const result = demoDb.getEntities({ page, limit, type: request.query.type });

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    });

    api.get<{
      Params: { id: string };
    }>('/entities/:id', {
      schema: {
        description: 'Get an entity by ID (demo mode)',
        tags: ['entities'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    }, async (request, reply) => {
      const entity = demoDb.getEntityById(request.params.id);
      if (!entity) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: `Entity '${request.params.id}' not found` },
        });
      }
      return { success: true, data: entity };
    });

    // ── Positions ───────────────────────────────────────────────

    api.get<{
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
        description: 'List positions with optional filters (demo mode)',
        tags: ['positions'],
        querystring: {
          type: 'object',
          properties: {
            entityId: { type: 'string' },
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
      const q = request.query;
      const data = demoDb.getPositions({
        entityId: q.entityId,
        minLat: q.minLat !== undefined ? Number(q.minLat) : undefined,
        maxLat: q.maxLat !== undefined ? Number(q.maxLat) : undefined,
        minLon: q.minLon !== undefined ? Number(q.minLon) : undefined,
        maxLon: q.maxLon !== undefined ? Number(q.maxLon) : undefined,
        start: q.start ? new Date(q.start) : undefined,
        end: q.end ? new Date(q.end) : undefined,
        limit: q.limit !== undefined ? Number(q.limit) : undefined,
      });

      return { success: true, data };
    });

    api.get('/positions/latest', {
      schema: {
        description: 'Get the latest position for each entity (demo mode)',
        tags: ['positions'],
      },
    }, async () => {
      const data = demoDb.getLatestPositions();
      return { success: true, data };
    });

    // ── Events ──────────────────────────────────────────────────

    api.get<{
      Querystring: { page?: string; limit?: string; type?: string; severity?: string };
    }>('/events', {
      schema: {
        description: 'List events with pagination (demo mode)',
        tags: ['events'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1' },
            limit: { type: 'string', default: '20' },
            type: { type: 'string' },
            severity: { type: 'string', enum: ['info', 'low', 'medium', 'high', 'critical'] },
          },
        },
      },
    }, async (request) => {
      const page = Math.max(1, Number(request.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 20)));

      const result = demoDb.getEvents({
        page,
        limit,
        type: request.query.type,
        severity: request.query.severity,
      });

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    });

    // ── Sources ─────────────────────────────────────────────────

    api.get('/sources', {
      schema: {
        description: 'List all data sources (demo mode)',
        tags: ['sources'],
      },
    }, async () => {
      const data = demoDb.getSources();
      return { success: true, data };
    });

    api.get<{
      Params: { id: string };
    }>('/sources/:id', {
      schema: {
        description: 'Get a data source by ID (demo mode)',
        tags: ['sources'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    }, async (request, reply) => {
      const source = demoDb.getSourceById(request.params.id);
      if (!source) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: `Data source '${request.params.id}' not found` },
        });
      }
      return { success: true, data: source };
    });

    // ── Stats ───────────────────────────────────────────────────

    api.get('/stats', {
      schema: {
        description: 'Dashboard summary statistics (demo mode)',
        tags: ['stats'],
      },
    }, async () => {
      const stats = demoDb.getStats();
      return { success: true, data: stats };
    });

  }, { prefix: '/api/v1' });
}
