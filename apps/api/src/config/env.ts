/**
 * Environment configuration for the HYDRA API server.
 *
 * Reads values from process.env with sensible defaults for local development.
 */

/** Typed environment configuration object. */
export interface EnvConfig {
  /** HTTP port the server listens on */
  readonly PORT: number;
  /** PostgreSQL connection URL */
  readonly DATABASE_URL: string;
  /** Redis connection URL */
  readonly REDIS_URL: string;
  /** Secret used to sign and verify JWT tokens */
  readonly JWT_SECRET: string;
  /** Runtime environment */
  readonly NODE_ENV: 'development' | 'production' | 'test';
  /** Pino log level */
  readonly LOG_LEVEL: string;
}

/**
 * Resolved environment configuration.
 *
 * Values are read once at module load time from `process.env`.
 * Missing optional values fall back to development-friendly defaults.
 */
export const env: EnvConfig = {
  PORT: Number(process.env['PORT'] ?? 3000),
  DATABASE_URL: process.env['DATABASE_URL'] ?? 'postgres://hydra:hydra@localhost:5432/hydra',
  REDIS_URL: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  JWT_SECRET: process.env['JWT_SECRET'] ?? 'change-me-in-production',
  NODE_ENV: (process.env['NODE_ENV'] as EnvConfig['NODE_ENV']) ?? 'development',
  LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
};
