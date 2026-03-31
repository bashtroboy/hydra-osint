import type { FastifyInstance } from 'fastify';

/**
 * Registers authentication routes (login, current user info).
 *
 * @param fastify - Fastify instance to register routes on
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /auth/login — authenticate with email and password.
   *
   * This is a placeholder that returns a signed JWT without verifying
   * credentials against the database. Replace with real authentication
   * once the user service is implemented.
   */
  fastify.post<{
    Body: { email: string; password: string };
  }>('/auth/login', {
    schema: {
      description: 'Authenticate and receive a JWT',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const { email } = request.body;

    // TODO: Verify credentials against the users table
    const token = fastify.jwt.sign({
      sub: '00000000-0000-0000-0000-000000000000',
      email,
      role: 'viewer',
    });

    return { success: true, data: { token } };
  });

  /**
   * GET /auth/me — return the current user's identity from their JWT.
   *
   * Requires a valid Bearer token.
   */
  fastify.get('/auth/me', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Get current authenticated user info',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const user = request.user;

    return {
      success: true,
      data: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
    };
  });
}
