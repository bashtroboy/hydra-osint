import type { ConnectionOptions } from 'bullmq';
import type { Worker } from 'bullmq';
import { createLogger } from '@hydra/core';
import { createDatabase, getDatabaseUrl } from '@hydra/database';
import type { DatabaseClient } from '@hydra/database';
import { createQueue, QUEUE_NAMES } from './queues.js';
import { createCollectionWorker } from './collection-worker.js';
import { scheduleCollectionJobs } from './scheduler.js';

const logger = createLogger({ name: 'workers' });

/**
 * Parse Redis connection options from environment variables.
 *
 * @returns BullMQ-compatible connection options
 */
function getRedisConnection(): ConnectionOptions {
  return {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: Number(process.env['REDIS_PORT'] ?? 6379),
    password: process.env['REDIS_PASSWORD'] ?? undefined,
    db: Number(process.env['REDIS_DB'] ?? 0),
  };
}

/** Active resources that need cleanup on shutdown. */
interface RunningResources {
  collectionWorker: Worker;
  db: DatabaseClient;
}

/**
 * Boot all workers, schedule repeatable jobs, and wire up graceful shutdown.
 */
async function main(): Promise<void> {
  logger.info('Starting HYDRA workers');

  const redisConnection = getRedisConnection();
  const db = createDatabase(getDatabaseUrl());

  // Create the collection queue and schedule repeatable jobs
  const collectionQueue = createQueue(QUEUE_NAMES.COLLECTION, redisConnection);
  await scheduleCollectionJobs(collectionQueue);

  // Start the collection worker
  const collectionWorker = createCollectionWorker(redisConnection, db);

  const resources: RunningResources = { collectionWorker, db };

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal, closing gracefully');

    try {
      await resources.collectionWorker.close();
      logger.info('Collection worker stopped');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error({ error: msg }, 'Error closing collection worker');
    }

    try {
      await collectionQueue.close();
      logger.info('Collection queue closed');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error({ error: msg }, 'Error closing collection queue');
    }

    try {
      await resources.db.connection.end();
      logger.info('Database connection closed');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error({ error: msg }, 'Error closing database connection');
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  logger.info('HYDRA workers running');
}

main().catch((error: unknown) => {
  const err = error instanceof Error ? { message: error.message, stack: error.stack } : error;
  logger.fatal({ err }, 'Failed to start workers');
  console.error('Worker startup error:', error);
  process.exit(1);
});
