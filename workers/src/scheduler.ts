import type { Queue } from 'bullmq';
import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { JOB_TYPES } from './queues.js';

/** Collection job schedule definitions. */
const COLLECTION_SCHEDULES = [
  { jobType: JOB_TYPES.ADSB_FETCH, intervalMs: 30_000, id: 'adsb-fetch-repeatable' },
  { jobType: JOB_TYPES.SATNOGS_FETCH, intervalMs: 120_000, id: 'satnogs-fetch-repeatable' },
  { jobType: JOB_TYPES.SONDEHUB_FETCH, intervalMs: 60_000, id: 'sondehub-fetch-repeatable' },
  { jobType: JOB_TYPES.OPENMHZ_FETCH, intervalMs: 30_000, id: 'openmhz-fetch-repeatable' },
  { jobType: JOB_TYPES.WSPRNET_FETCH, intervalMs: 300_000, id: 'wsprnet-fetch-repeatable' },
  { jobType: JOB_TYPES.EIBI_FETCH, intervalMs: 86_400_000, id: 'eibi-fetch-repeatable' },
  { jobType: JOB_TYPES.PRIYOM_FETCH, intervalMs: 3_600_000, id: 'priyom-fetch-repeatable' },
] as const;

/**
 * Schedule repeatable collection jobs on the given queue.
 *
 * Uses BullMQ's built-in repeat mechanism to ensure jobs are enqueued
 * at fixed intervals. Existing repeatable jobs with the same key are
 * automatically de-duplicated by BullMQ.
 *
 * @param collectionQueue - The BullMQ collection queue
 */
export async function scheduleCollectionJobs(queue: Queue): Promise<void> {
  const logger: Logger = createLogger({ name: 'job-scheduler' });

  for (const schedule of COLLECTION_SCHEDULES) {
    await queue.add(
      schedule.jobType,
      { timestamp: Date.now() },
      {
        repeat: {
          every: schedule.intervalMs,
        },
        jobId: schedule.id,
      },
    );

    logger.info(
      { jobType: schedule.jobType, intervalMs: schedule.intervalMs },
      `Scheduled repeatable ${schedule.jobType} job`,
    );
  }
}
