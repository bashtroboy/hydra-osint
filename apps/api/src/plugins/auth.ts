import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/index.js';

/**
 * Registers @fastify/jwt and adds an `authenticate` decorator that
 * verifies the Bearer token on protected routes.
 */
async function authPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '24h' },
  });

  /**
   * Prehandler decorator — call `fastify.authenticate` in a route's
   * `preHandler` array to require a valid JWT.
   */
  fastify.decorate(
    'authenticate',
    async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid or missing authentication token',
          },
        });
      }
    },
  );
}

export default fp(authPlugin, {
  name: 'hydra-auth',
});
