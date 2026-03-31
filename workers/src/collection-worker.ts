import { Worker } from 'bullmq';
import type { Job, ConnectionOptions } from 'bullmq';
import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import type { DatabaseClient } from '@hydra/database';
import { AdsbCollector, createAdsbConfig } from '@hydra/collectors';
import type { CollectorResult } from '@hydra/collectors';
import { QUEUE_NAMES, JOB_TYPES } from './queues.js';

/** Data payload for ADS-B fetch jobs. */
interface AdsbFetchJobData {
  /** Timestamp when the job was scheduled (Unix ms). */
  timestamp: number;
}

/** Union of all known collection job data shapes. */
type CollectionJobData = AdsbFetchJobData;

/**
 * Creates and starts a BullMQ worker that processes data-collection jobs.
 *
 * Supports the following job types:
 * - `adsb-fetch`: Invokes the ADS-B collector to fetch and persist aircraft states
 *
 * @param connection  - Redis connection options
 * @param db          - HYDRA database client
 * @param concurrency - Number of jobs to process concurrently. Defaults to 1.
 * @returns The running BullMQ Worker instance
 *
 * @example
 * ```ts
 * const worker = createCollectionWorker(redisOpts, dbClient, 2);
 * ```
 */
export function createCollectionWorker(
  connection: ConnectionOptions,
  db: DatabaseClient,
  concurrency = 1,
): Worker<CollectionJobData, CollectorResult> {
  const logger: Logger = createLogger({ name: 'collection-worker' });

  const adsbConfig = createAdsbConfig();
  const adsbCollector = new AdsbCollector(adsbConfig, db);

  const worker = new Worker<CollectionJobData, CollectorResult>(
    QUEUE_NAMES.COLLECTION,
    async (job: Job<CollectionJobData, CollectorResult>) => {
      logger.info(
        { jobId: job.id, jobName: job.name, attempt: job.attemptsMade + 1 },
        'Processing collection job',
      );

      await job.updateProgress(0);

      let result: CollectorResult;

      switch (job.name) {
        case JOB_TYPES.ADSB_FETCH: {
          result = await adsbCollector.collect();
          break;
        }
        default: {
          const message = `Unknown job type: ${job.name}`;
          logger.error({ jobName: job.name }, message);
          throw new Error(message);
        }
      }

      await job.updateProgress(100);

      if (!result.success) {
        logger.warn(
          { jobId: job.id, errors: result.errors },
          'Collection job completed with errors',
        );
      } else {
        logger.info(
          { jobId: job.id, recordsProcessed: result.recordsProcessed },
          'Collection job completed successfully',
        );
      }

      return result;
    },
    {
      connection,
      concurrency,
      limiter: {
        max: 1,
        duration: 10_000, // at most 1 job per 10s to respect API rate limits
      },
    },
  );

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, jobName: job?.name, error: error.message },
      'Collection job failed',
    );
  });

  worker.on('error', (error) => {
    logger.error({ error: error.message }, 'Worker error');
  });

  logger.info({ concurrency }, 'Collection worker started');

  return worker;
}
