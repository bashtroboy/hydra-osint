import type { FastifyReply, FastifyRequest } from 'fastify';
import { HydraError } from '@hydra/core';
import { ZodError } from 'zod';

/** Shape of a Fastify error that includes an HTTP status code. */
interface FastifyLikeError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler for the Fastify instance.
 *
 * Maps known error types to structured API error responses:
 * - {@link HydraError} subclasses use their own status code and error code.
 * - {@link ZodError} instances are returned as 400 validation errors.
 * - Everything else results in a generic 500 response.
 *
 * @param error - The thrown error or Fastify error object
 * @param request - Incoming Fastify request
 * @param reply - Fastify reply used to send the error response
 */
export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const correlationId = request.id;

  if (error instanceof HydraError) {
    request.log.warn({ err: error, correlationId }, error.message);
    void reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      correlationId,
    });
    return;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    request.log.warn({ err: error, correlationId }, 'Validation error');
    void reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { issues: details },
      },
      correlationId,
    });
    return;
  }

  // Fastify errors (e.g. rate limiting, not found) carry a statusCode
  const fastifyErr = error as FastifyLikeError;
  const statusCode = fastifyErr.statusCode ?? 500;

  if (statusCode >= 500) {
    request.log.error({ err: error, correlationId }, 'Unhandled server error');
  } else {
    request.log.warn({ err: error, correlationId }, error.message);
  }

  void reply.status(statusCode).send({
    success: false,
    error: {
      code: fastifyErr.code ?? 'INTERNAL_SERVER_ERROR',
      message: statusCode >= 500 ? 'An unexpected error occurred' : error.message,
    },
    correlationId,
  });
}
