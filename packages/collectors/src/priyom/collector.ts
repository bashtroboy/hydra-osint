import type { Logger } from 'pino';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '@hydra/core';
import type { DatabaseClient } from '@hydra/database';
import { entities, events } from '@hydra/database';
import type { CollectorResult } from '../shared/types.js';
import type { PriyomCollectorConfig } from './config.js';
import { PriyomClient } from './client.js';
import type { PriyomStation, PriyomScheduleEntry } from './types.js';

/**
 * Priyom numbers station collector that catalogs known stations and
 * their schedules into the HYDRA database.
 *
 * Each station is stored as a "network" entity (the closest available
 * entity type for radio stations). Schedule entries are stored as
 * events with type "numbers_station_schedule".
 *
 * @example
 * ```ts
 * const collector = new PriyomCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class PriyomCollector {
  private readonly logger: Logger;
  private readonly client: PriyomClient;
  private readonly db: DatabaseClient;

  /**
   * @param config - Priyom collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: PriyomCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'priyom-collector' });
    this.client = new PriyomClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. Retrieve the catalogue of known numbers stations
   * 2. Upsert each station as a "network" entity
   * 3. Store schedule entries as "numbers_station_schedule" events
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info('Starting Priyom numbers station collection cycle');

    try {
      // Step 1: Get known stations
      const stations = this.client.getKnownStations();
      this.logger.info({ count: stations.length }, 'Retrieved known stations');

      // Step 2: Upsert station entities
      const entityIdMap = await this.upsertStationEntities(stations, errors);
      recordsProcessed += entityIdMap.size;

      // Step 3: Build schedule entries from station data and store as events
      const scheduleEntries = this.buildScheduleEntries(stations);
      const eventsInserted = await this.storeScheduleEvents(
        scheduleEntries,
        entityIdMap,
        errors,
      );
      recordsProcessed += eventsInserted;

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'Priyom collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'Priyom collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Upsert each numbers station as a "network" entity.
   *
   * @param stations - Known station records
   * @param errors   - Mutable error list for non-fatal failures
   * @returns Map of station designator -> entity UUID
   */
  private async upsertStationEntities(
    stations: PriyomStation[],
    errors: string[],
  ): Promise<Map<string, string>> {
    const entityIdMap = new Map<string, string>();

    for (const station of stations) {
      try {
        const existing = await this.db.db
          .select({ id: entities.id })
          .from(entities)
          .where(
            and(
              eq(entities.type, 'network'),
              eq(entities.identifier, station.designator),
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          await this.db.db
            .update(entities)
            .set({
              lastSeen: new Date(),
              name: station.name,
              metadata: {
                designator: station.designator,
                country: station.country,
                language: station.language,
                frequencies: station.frequencies,
                description: station.description,
                status: station.status,
              },
              updatedAt: new Date(),
            })
            .where(eq(entities.id, existing[0].id));

          entityIdMap.set(station.designator, existing[0].id);
        } else {
          const inserted = await this.db.db
            .insert(entities)
            .values({
              type: 'network',
              identifier: station.designator,
              name: station.name,
              metadata: {
                designator: station.designator,
                country: station.country,
                language: station.language,
                frequencies: station.frequencies,
                description: station.description,
                status: station.status,
              },
            })
            .returning({ id: entities.id });

          if (inserted[0]) {
            entityIdMap.set(station.designator, inserted[0].id);
          }
        }
      } catch (error: unknown) {
        const msg = `Failed to upsert station entity ${station.designator}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(msg);
        this.logger.warn({ designator: station.designator, error: msg }, 'Station entity upsert failed');
      }
    }

    this.logger.debug({ entityCount: entityIdMap.size }, 'Station entities upserted');
    return entityIdMap;
  }

  /**
   * Build schedule entries from stations that have known frequencies.
   *
   * Since exact schedule times are not always available from the hardcoded
   * catalogue, this creates placeholder entries for each station/frequency
   * combination.
   *
   * @param stations - Known station records
   * @returns Array of schedule entries
   */
  private buildScheduleEntries(stations: PriyomStation[]): PriyomScheduleEntry[] {
    const entries: PriyomScheduleEntry[] = [];

    for (const station of stations) {
      for (const frequency of station.frequencies) {
        entries.push({
          stationName: station.name,
          designator: station.designator,
          frequency,
          time: 'varies',
          notes: station.description,
        });
      }
    }

    return entries;
  }

  /**
   * Store schedule entries as events in the database.
   *
   * @param entries    - Schedule entries to store
   * @param entityIdMap - Map of designator -> entity UUID (used for metadata)
   * @param errors     - Mutable error list for non-fatal failures
   * @returns Number of events successfully inserted
   */
  private async storeScheduleEvents(
    entries: PriyomScheduleEntry[],
    entityIdMap: Map<string, string>,
    errors: string[],
  ): Promise<number> {
    let inserted = 0;

    for (const entry of entries) {
      try {
        const entityId = entityIdMap.get(entry.designator);

        await this.db.db.insert(events).values({
          type: 'numbers_station_schedule',
          severity: 'info',
          title: `${entry.designator} schedule: ${entry.frequency} kHz`,
          description: entry.notes ?? null,
          startTime: new Date(),
          metadata: {
            stationName: entry.stationName,
            designator: entry.designator,
            frequency: entry.frequency,
            time: entry.time,
            dayOfWeek: entry.dayOfWeek,
            entityId,
            source: 'priyom',
          },
        });

        inserted += 1;
      } catch (error: unknown) {
        const msg = `Failed to insert schedule event for ${entry.designator} @ ${entry.frequency} kHz: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(msg);
        this.logger.warn({ designator: entry.designator, error: msg }, 'Schedule event insert failed');
      }
    }

    this.logger.debug({ insertedEvents: inserted }, 'Schedule events stored');
    return inserted;
  }
}
