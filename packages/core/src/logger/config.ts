import type { LoggerOptions } from 'pino';

/** Fields that are redacted from log output to prevent credential leakage. */
export const DEFAULT_REDACT_PATHS: readonly string[] = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'req.headers.authorization',
  'req.headers.cookie',
] as const;

/** Default pino log level. Reads from `LOG_LEVEL` env var or falls back to `'info'`. */
export const DEFAULT_LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'info';

/**
 * Returns the default pino logger configuration used throughout HYDRA.
 *
 * @param name - Logger name (typically the service or package name)
 * @returns Pino logger options
 */
export function getDefaultLoggerConfig(name: string): LoggerOptions {
  return {
    name,
    level: DEFAULT_LOG_LEVEL,
    redact: [...DEFAULT_REDACT_PATHS],
    timestamp: true,
  };
}
