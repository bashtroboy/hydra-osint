import pino, { type Logger, type LoggerOptions } from 'pino';
import { getDefaultLoggerConfig, DEFAULT_REDACT_PATHS } from './config.js';

export { DEFAULT_REDACT_PATHS, DEFAULT_LOG_LEVEL, getDefaultLoggerConfig } from './config.js';

/** Options for creating a HYDRA logger instance. */
export interface CreateLoggerOptions {
  /** Logger name (e.g. "api", "adsb-collector") */
  name: string;
  /** Log level override. Defaults to `LOG_LEVEL` env var or `'info'`. */
  level?: string;
  /** Additional field paths to redact from log output. */
  additionalRedactPaths?: string[];
}

/**
 * Creates a pino logger pre-configured with HYDRA defaults including
 * sensitive-field redaction and structured output.
 *
 * @param options - Logger configuration
 * @returns A configured pino Logger instance
 *
 * @example
 * ```ts
 * const logger = createLogger({ name: 'adsb-collector', level: 'debug' });
 * logger.info({ icao: '4B1613' }, 'Aircraft position updated');
 * ```
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const baseConfig = getDefaultLoggerConfig(options.name);

  const config: LoggerOptions = {
    ...baseConfig,
    ...(options.level !== undefined && { level: options.level }),
    ...(options.additionalRedactPaths !== undefined && {
      redact: [...DEFAULT_REDACT_PATHS, ...options.additionalRedactPaths],
    }),
  };

  return pino(config);
}
