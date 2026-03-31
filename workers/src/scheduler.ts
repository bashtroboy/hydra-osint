import type { Queue } from 'bullmq';
import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { JOB_TYPES } from './queues.js';

/** Default interval for ADS-B fetch jobs in milliseconds. */
const ADSB_FETCH_INTERVAL_MS = 30_000;

/**
 * Schedule repeatable collection jobs on the given queue.
 *
 * Uses BullMQ's built-in repeat mechanism to ensure jobs are enqueued
 * at fixed intervals. Existing repeatable jobs with the same key are
 * automatically de-duplicated by BullMQ.
 *
 * @param collectionQueue - The BullMQ collection queue
 *
 * @example
 * ```ts
 * const queue = createQueue(QUEUE_NAMES.COLLECTION, redisConnection);
 * await scheduleCollectionJobs(queue);
 * ```
 */
export async function scheduleCollectionJobs(queue: Queue): Promise<void> {
  const logger: Logger = createLogger({ name: 'job-scheduler' });

  // Schedule ADS-B fetch every 30 seconds
  await queue.add(
    JOB_TYPES.ADSB_FETCH,
    { timestamp: Date.now() },
    {
      repeat: {
        every: ADSB_FETCH_INTERVAL_MS,
      },
      jobId: 'adsb-fetch-repeatable',
    },
  );

  logger.info(
    { jobType: JOB_TYPES.ADSB_FETCH, intervalMs: ADSB_FETCH_INTERVAL_MS },
    'Scheduled repeatable ADS-B fetch job',
  );
}
