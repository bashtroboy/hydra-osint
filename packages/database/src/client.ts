import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/** Shape returned by {@link createDatabase} */
export interface DatabaseClient {
  /** Drizzle ORM instance with full schema type information */
  db: ReturnType<typeof drizzle<typeof schema>>;
  /** Underlying postgres.js connection for lifecycle management */
  connection: postgres.Sql;
}

/**
 * Create a Drizzle database client from a PostgreSQL connection URL.
 *
 * @param url - PostgreSQL connection string (e.g. `postgres://user:pass@host:5432/db`)
 * @returns An object containing the Drizzle `db` handle and the raw `connection`
 *
 * @example
 * ```ts
 * const { db, connection } = createDatabase('postgres://localhost:5432/hydra');
 * const rows = await db.select().from(entities);
 * await connection.end();
 * ```
 */
export function createDatabase(url: string): DatabaseClient {
  const connection = postgres(url, { max: 10 });
  const db = drizzle(connection, { schema });
  return { db, connection };
}

/**
 * Read the database connection URL from the `DATABASE_URL` environment variable.
 *
 * @returns The connection URL string
 * @throws {Error} If `DATABASE_URL` is not set
 */
export function getDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}
