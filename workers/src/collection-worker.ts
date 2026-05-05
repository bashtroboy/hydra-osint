import { Worker } from 'bullmq';
import type { Job, ConnectionOptions } from 'bullmq';
import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import type { DatabaseClient } from '@hydra/database';
import {
  AdsbCollector,
  createAdsbConfig,
  SatnogsCollector,
  createSatnogsConfig,
  SondehubCollector,
  createSondehubConfig,
  OpenmhzCollector,
  createOpenmhzConfig,
  WsprnetCollector,
  createWsprnetConfig,
  EibiCollector,
  createEibiConfig,
  PriyomCollector,
  createPriyomConfig,
} from '@hydra/collectors';
import type { CollectorResult } from '@hydra/collectors';
import { QUEUE_NAMES, JOB_TYPES } from './queues.js';

/** Data payload for collection jobs. */
interface CollectionJobData {
  /** Timestamp when the job was scheduled (Unix ms). */
  timestamp: number;
}

/**
 * Creates and starts a BullMQ worker that processes data-collection jobs.
 *
 * Supports the following job types:
 * - `adsb-fetch`: Aircraft tracking via OpenSky Network
 * - `satnogs-fetch`: Satellite telemetry via SatNOGS
 * - `sondehub-fetch`: Weather radiosonde tracking via SondeHub
 * - `openmhz-fetch`: Trunked radio calls via OpenMHz
 * - `wsprnet-fetch`: HF propagation beacons via WSPRnet
 * - `eibi-fetch`: Shortwave broadcast schedules via EiBi
 * - `priyom-fetch`: Numbers station schedules via Priyom
 *
 * @param connection  - Redis connection options
 * @param db          - HYDRA database client
 * @param concurrency - Number of jobs to process concurrently. Defaults to 2.
 * @returns The running BullMQ Worker instance
 */
export function createCollectionWorker(
  connection: ConnectionOptions,
  db: DatabaseClient,
  concurrency = 2,
): Worker<CollectionJobData, CollectorResult> {
  const logger: Logger = createLogger({ name: 'collection-worker' });

  // Initialize all collectors
  const collectors = {
    [JOB_TYPES.ADSB_FETCH]: new AdsbCollector(createAdsbConfig(), db),
    [JOB_TYPES.SATNOGS_FETCH]: new SatnogsCollector(createSatnogsConfig(), db),
    [JOB_TYPES.SONDEHUB_FETCH]: new SondehubCollector(createSondehubConfig(), db),
    [JOB_TYPES.OPENMHZ_FETCH]: new OpenmhzCollector(createOpenmhzConfig(), db),
    [JOB_TYPES.WSPRNET_FETCH]: new WsprnetCollector(createWsprnetConfig(), db),
    [JOB_TYPES.EIBI_FETCH]: new EibiCollector(createEibiConfig(), db),
    [JOB_TYPES.PRIYOM_FETCH]: new PriyomCollector(createPriyomConfig(), db),
  } as const;

  const worker = new Worker<CollectionJobData, CollectorResult>(
    QUEUE_NAMES.COLLECTION,
    async (job: Job<CollectionJobData, CollectorResult>) => {
      logger.info(
        { jobId: job.id, jobName: job.name, attempt: job.attemptsMade + 1 },
        'Processing collection job',
      );

      await job.updateProgress(0);

      const collector = collectors[job.name as keyof typeof collectors];
      if (!collector) {
        const message = `Unknown job type: ${job.name}`;
        logger.error({ jobName: job.name }, message);
        throw new Error(message);
      }

      const result = await collector.collect();

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
        max: 2,
        duration: 10_000,
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

  logger.info(
    { concurrency, collectors: Object.keys(collectors) },
    'Collection worker started',
  );

  return worker;
}
