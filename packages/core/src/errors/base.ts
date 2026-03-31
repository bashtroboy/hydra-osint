/**
 * Base error class for all HYDRA platform errors.
 * Provides structured error information including an error code,
 * HTTP status code, and optional details.
 */
export class HydraError extends Error {
  /** Machine-readable error code (e.g. "NOT_FOUND", "RATE_LIMITED") */
  public readonly code: string;

  /** Corresponding HTTP status code */
  public readonly statusCode: number;

  /** Optional structured details about the error */
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HydraError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a requested resource cannot be found.
 *
 * @example
 * ```ts
 * throw new NotFoundError('Aircraft', { icao: '4B1613' });
 * ```
 */
export class NotFoundError extends HydraError {
  constructor(resource: string, details?: Record<string, unknown>) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when input data fails validation.
 *
 * @example
 * ```ts
 * throw new ValidationError('Invalid latitude value', { field: 'lat', value: 999 });
 * ```
 */
export class ValidationError extends HydraError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when authentication credentials are missing or invalid.
 */
export class AuthenticationError extends HydraError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when the authenticated user lacks permission for the requested operation.
 */
export class AuthorizationError extends HydraError {
  constructor(message = 'Insufficient permissions', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Thrown when a rate limit has been exceeded.
 */
export class RateLimitError extends HydraError {
  constructor(
    message = 'Rate limit exceeded',
    details?: Record<string, unknown>,
  ) {
    super(message, 'RATE_LIMITED', 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown when an external service (upstream API, database, etc.) returns an error.
 */
export class ExternalServiceError extends HydraError {
  constructor(
    service: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(`External service error [${service}]: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, details);
    this.name = 'ExternalServiceError';
  }
}
