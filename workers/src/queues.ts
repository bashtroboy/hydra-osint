import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

/** Queue name constants. */
export const QUEUE_NAMES = {
  /** Queue for data collection jobs (ADS-B, AIS, etc.). */
  COLLECTION: 'hydra:collection',
  /** Queue for post-collection processing (correlation, enrichment). */
  PROCESSING: 'hydra:processing',
} as const;

/** Job type constants within the collection queue. */
export const JOB_TYPES = {
  ADSB_FETCH: 'adsb-fetch',
  AIS_FETCH: 'ais-fetch',
} as const;

/**
 * Create a BullMQ queue with the given name and Redis connection.
 *
 * @param name       - Queue name (use constants from {@link QUEUE_NAMES})
 * @param connection - Redis connection options
 * @returns A configured BullMQ Queue instance
 *
 * @example
 * ```ts
 * const queue = createQueue(QUEUE_NAMES.COLLECTION, { host: 'localhost', port: 6379 });
 * await queue.add(JOB_TYPES.ADSB_FETCH, { timestamp: Date.now() });
 * ```
 */
export function createQueue(
  name: string,
  connection: ConnectionOptions,
): Queue {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5_000,
      },
      removeOnComplete: {
        age: 3600, // keep completed jobs for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 86_400, // keep failed jobs for 24 hours
      },
    },
  });
}
