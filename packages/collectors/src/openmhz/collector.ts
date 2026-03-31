import type { Logger } from 'pino';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '@hydra/core';
import type { DatabaseClient, NewEvent } from '@hydra/database';
import { events } from '@hydra/database';
import type { CollectorResult } from '../shared/types.js';
import type { OpenmhzCollectorConfig } from './config.js';
import { OpenmhzClient } from './client.js';
import type { OpenmhzCall } from './types.js';

/**
 * Trunked radio collector that fetches call records from OpenMHz,
 * and persists them as intelligence events in the HYDRA database.
 *
 * Unlike position-based collectors (ADS-B, AIS), this collector stores
 * discrete event records rather than entity positions, since radio calls
 * are time-bounded events with audio recordings.
 *
 * @example
 * ```ts
 * const collector = new OpenmhzCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class OpenmhzCollector {
  private readonly logger: Logger;
  private readonly client: OpenmhzClient;
  private readonly config: OpenmhzCollectorConfig;
  private readonly db: DatabaseClient;

  /**
   * @param config - OpenMHz collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: OpenmhzCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'openmhz-collector' });
    this.config = config;
    this.client = new OpenmhzClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. For each configured system, fetch recent calls
   * 2. Deduplicate against already-stored calls
   * 3. Insert new calls as event records (type: 'radio_call')
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info(
      { systems: this.config.systems },
      'Starting OpenMHz collection cycle',
    );

    if (this.config.systems.length === 0) {
      this.logger.warn('No systems configured for OpenMHz collector');
      return { success: true, recordsProcessed: 0, errors: [] };
    }

    try {
      for (const system of this.config.systems) {
        const count = await this.collectSystem(system, errors);
        recordsProcessed += count;
      }

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'OpenMHz collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'OpenMHz collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Collect calls for a single system and insert them as events.
   *
   * @param system - System shortName to collect
   * @param errors - Mutable error list to accumulate non-fatal failures
   * @returns Number of records successfully inserted
   */
  private async collectSystem(
    system: string,
    errors: string[],
  ): Promise<number> {
    let inserted = 0;

    try {
      const calls = await this.client.fetchCalls(system);

      // Limit to maxCalls per fetch
      const limitedCalls = calls.slice(0, this.config.maxCalls);

      this.logger.debug(
        { system, fetched: calls.length, limited: limitedCalls.length },
        'Processing calls for system',
      );

      for (const call of limitedCalls) {
        try {
          const isDuplicate = await this.isCallAlreadyStored(call);
          if (isDuplicate) {
            continue;
          }

          const eventRecord = this.buildEventRecord(call);
          await this.db.db.insert(events).values(eventRecord);
          inserted += 1;
        } catch (error: unknown) {
          const msg = `Failed to insert call ${call._id} from ${system}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(msg);
          this.logger.warn({ callId: call._id, system, error: msg }, 'Call insert failed');
        }
      }

      this.logger.info(
        { system, inserted, total: limitedCalls.length },
        'Finished collecting system calls',
      );
    } catch (error: unknown) {
      const msg = `Failed to fetch calls for system ${system}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(msg);
      this.logger.error({ system, error: msg }, 'System collection failed');
    }

    return inserted;
  }

  /**
   * Check whether a call has already been stored in the events table
   * by matching on the OpenMHz call ID stored in metadata.
   *
   * @param call - The OpenMHz call to check
   * @returns `true` if the call already exists in the database
   */
  private async isCallAlreadyStored(call: OpenmhzCall): Promise<boolean> {
    const existing = await this.db.db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.type, 'radio_call'),
          eq(events.title, `[${call.shortName}] TG ${call.talkgroupNum}: ${call.talkgroupDescription ?? 'Unknown'}`),
          eq(events.startTime, new Date(call.startTime)),
        ),
      )
      .limit(1);

    return existing.length > 0;
  }

  /**
   * Transform an OpenMHz call into a HYDRA event record.
   *
   * @param call - The OpenMHz call to convert
   * @returns A new event record ready for database insertion
   */
  private buildEventRecord(call: OpenmhzCall): NewEvent {
    const title = `[${call.shortName}] TG ${call.talkgroupNum}: ${call.talkgroupDescription ?? 'Unknown'}`;

    const description = [
      `Trunked radio call on system "${call.shortName}"`,
      `Talkgroup: ${call.talkgroupNum}${call.talkgroupDescription ? ` (${call.talkgroupDescription})` : ''}`,
      `Frequency: ${(call.freq / 1_000_000).toFixed(4)} MHz`,
      `Duration: ${call.len.toFixed(1)}s`,
      `Sources: ${call.srcList.length}`,
    ].join('. ');

    return {
      type: 'radio_call',
      severity: 'info',
      title,
      description,
      startTime: new Date(call.startTime),
      endTime: new Date(call.stopTime),
      metadata: {
        openmhzCallId: call._id,
        shortName: call.shortName,
        talkgroupNum: call.talkgroupNum,
        talkgroupDescription: call.talkgroupDescription ?? null,
        freq: call.freq,
        freqMhz: call.freq / 1_000_000,
        duration: call.len,
        audioUrl: call.url,
        srcList: call.srcList,
      },
    };
  }
}
