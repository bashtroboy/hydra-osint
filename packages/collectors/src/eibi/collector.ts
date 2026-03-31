import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import type { DatabaseClient } from '@hydra/database';
import { events } from '@hydra/database';
import type { CollectorResult } from '../shared/types.js';
import type { EibiCollectorConfig } from './config.js';
import { EibiClient } from './client.js';
import type { EibiBroadcast } from './types.js';

/**
 * EiBi shortwave schedule collector that downloads broadcast schedule data,
 * parses the CSV, and persists each entry as a HYDRA event of type
 * `shortwave_broadcast`.
 *
 * @example
 * ```ts
 * const collector = new EibiCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class EibiCollector {
  private readonly logger: Logger;
  private readonly client: EibiClient;
  private readonly db: DatabaseClient;

  /**
   * @param config - EiBi collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: EibiCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'eibi-collector' });
    this.client = new EibiClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. Download and parse the EiBi CSV schedule
   * 2. Store each broadcast as a `shortwave_broadcast` event
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info('Starting EiBi collection cycle');

    try {
      const broadcasts = await this.client.fetchSchedule();

      if (broadcasts.length === 0) {
        this.logger.info('No broadcasts found in EiBi schedule');
        return { success: true, recordsProcessed: 0, errors: [] };
      }

      this.logger.info({ count: broadcasts.length }, 'Processing EiBi broadcasts');

      for (const broadcast of broadcasts) {
        try {
          await this.persistBroadcast(broadcast);
          recordsProcessed++;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          const msg = `Failed to persist broadcast ${broadcast.station} @ ${broadcast.frequency} kHz: ${message}`;
          errors.push(msg);
          this.logger.warn(
            { station: broadcast.station, frequency: broadcast.frequency, error: message },
            'Broadcast persistence failed',
          );
        }
      }

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'EiBi collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'EiBi collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Convert an EiBi broadcast schedule entry into a HYDRA event and insert it.
   *
   * The `startTime` is derived from the broadcast's `timeStart` field
   * interpreted as UTC on the current date.
   *
   * @param broadcast - A single EiBi broadcast record
   */
  private async persistBroadcast(broadcast: EibiBroadcast): Promise<void> {
    const startTime = this.parseUtcTime(broadcast.timeStart);
    const endTime = this.parseUtcTime(broadcast.timeEnd);

    await this.db.db.insert(events).values({
      type: 'shortwave_broadcast',
      severity: 'info',
      title: `SW broadcast: ${broadcast.station} on ${broadcast.frequency} kHz`,
      description: `${broadcast.station} broadcasting in ${broadcast.language} to ${broadcast.targetArea} on ${broadcast.frequency} kHz (${broadcast.timeStart}-${broadcast.timeEnd} UTC, ${broadcast.days})`,
      startTime,
      endTime,
      metadata: {
        frequency: broadcast.frequency,
        timeStart: broadcast.timeStart,
        timeEnd: broadcast.timeEnd,
        days: broadcast.days,
        station: broadcast.station,
        language: broadcast.language,
        targetArea: broadcast.targetArea,
        transmitterSite: broadcast.transmitterSite,
        persistence: broadcast.persistence,
        startDate: broadcast.startDate,
        endDate: broadcast.endDate,
      },
    });
  }

  /**
   * Parse a UTC time string in HHMM format to a Date object on the current day.
   *
   * @param hhmm - Time string (e.g. "1430", "0000", "2400")
   * @returns A Date set to the given time today in UTC
   */
  private parseUtcTime(hhmm: string): Date {
    const now = new Date();
    const hours = parseInt(hhmm.substring(0, 2), 10) || 0;
    const minutes = parseInt(hhmm.substring(2, 4), 10) || 0;

    // Handle "2400" as midnight of the next day
    const adjustedHours = hours >= 24 ? 0 : hours;

    const date = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + (hours >= 24 ? 1 : 0),
      adjustedHours,
      minutes,
    ));

    return date;
  }
}
