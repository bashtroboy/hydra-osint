import type { FastifyRequest, FastifyReply } from 'fastify';

/** JWT payload stored in signed tokens. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Prehandler that verifies a Bearer JWT and populates request.user. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
