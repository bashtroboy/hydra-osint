import type { Logger } from 'pino';
import { eq, and } from 'drizzle-orm';
import { createLogger, chunk } from '@hydra/core';
import type { DatabaseClient, NewPosition } from '@hydra/database';
import { entities, positions } from '@hydra/database';
import type { CollectorResult } from '../shared/types.js';
import type { SatnogsCollectorConfig } from './config.js';
import type { SatnogsObservation } from './types.js';
import { SatnogsClient } from './client.js';

/**
 * SatNOGS telemetry collector that fetches satellite observation data
 * from the SatNOGS Network, upserts satellite entities, and persists
 * ground-station-based position records to the HYDRA database.
 *
 * @example
 * ```ts
 * const collector = new SatnogsCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class SatnogsCollector {
  private readonly logger: Logger;
  private readonly client: SatnogsClient;
  private readonly config: SatnogsCollectorConfig;
  private readonly db: DatabaseClient;

  /**
   * @param config - SatNOGS collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: SatnogsCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'satnogs-collector' });
    this.config = config;
    this.client = new SatnogsClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. Fetch recent observations from the SatNOGS Network
   * 2. Upsert satellite entities for each unique NORAD ID
   * 3. Create position records from ground station location data
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info('Starting SatNOGS collection cycle');

    try {
      const observations = await this.client.fetchRecentObservations();

      if (observations.length === 0) {
        this.logger.info('No observations returned from SatNOGS');
        return { success: true, recordsProcessed: 0, errors: [] };
      }

      this.logger.info(
        { count: observations.length },
        'Fetched SatNOGS observations',
      );

      // Upsert satellite entities and collect entity IDs
      const entityIdMap = await this.upsertSatelliteEntities(observations, errors);

      // Build position records from observations with ground station location
      const positionRecords = this.buildPositionRecords(observations, entityIdMap);

      // Batch insert positions
      if (positionRecords.length > 0) {
        await this.insertPositionsBatch(positionRecords);
        recordsProcessed = positionRecords.length;
      }

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'SatNOGS collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'SatNOGS collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Upsert satellite entities for each unique NORAD catalog ID in the observations.
   *
   * De-duplicates observations by NORAD ID, keeping the most recent one
   * (by end timestamp) for metadata updates.
   *
   * @param observations - SatNOGS observation records
   * @param errors       - Mutable error list to accumulate non-fatal failures
   * @returns Map of norad_cat_id -> entity UUID
   */
  private async upsertSatelliteEntities(
    observations: SatnogsObservation[],
    errors: string[],
  ): Promise<Map<number, string>> {
    const entityIdMap = new Map<number, string>();

    // De-duplicate by norad_cat_id — keep the most recent observation
    const uniqueByNorad = new Map<number, SatnogsObservation>();
    for (const obs of observations) {
      const existing = uniqueByNorad.get(obs.norad_cat_id);
      if (!existing || obs.end > existing.end) {
        uniqueByNorad.set(obs.norad_cat_id, obs);
      }
    }

    for (const [noradId, obs] of uniqueByNorad) {
      try {
        const noradStr = String(noradId);

        // Try to find existing entity
        const existing = await this.db.db
          .select({ id: entities.id })
          .from(entities)
          .where(
            and(
              eq(entities.type, 'satellite'),
              eq(entities.identifier, noradStr),
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          // Update lastSeen
          await this.db.db
            .update(entities)
            .set({
              lastSeen: new Date(),
              metadata: {
                noradCatId: noradId,
                stationName: obs.station_name,
                transmitter: obs.transmitter,
                observationStatus: obs.status,
              },
              updatedAt: new Date(),
            })
            .where(eq(entities.id, existing[0].id));

          entityIdMap.set(noradId, existing[0].id);
        } else {
          // Insert new entity
          const inserted = await this.db.db
            .insert(entities)
            .values({
              type: 'satellite',
              identifier: noradStr,
              name: null,
              metadata: {
                noradCatId: noradId,
                stationName: obs.station_name,
                transmitter: obs.transmitter,
                observationStatus: obs.status,
              },
            })
            .returning({ id: entities.id });

          if (inserted[0]) {
            entityIdMap.set(noradId, inserted[0].id);
          }
        }
      } catch (error: unknown) {
        const msg = `Failed to upsert satellite entity ${noradId}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(msg);
        this.logger.warn({ noradId, error: msg }, 'Satellite entity upsert failed');
      }
    }

    this.logger.debug({ entityCount: entityIdMap.size }, 'Satellite entities upserted');
    return entityIdMap;
  }

  /**
   * Build position records from observations that have ground station location data.
   *
   * Each observation's ground station coordinates are used to create a position
   * record associated with the satellite entity. This records where the satellite
   * was observed from, providing spatial context for the telemetry data.
   *
   * @param observations - SatNOGS observation records
   * @param entityIdMap  - Map of norad_cat_id -> entity UUID
   * @returns Array of position records ready for insertion
   */
  private buildPositionRecords(
    observations: SatnogsObservation[],
    entityIdMap: Map<number, string>,
  ): NewPosition[] {
    const records: NewPosition[] = [];

    for (const obs of observations) {
      const entityId = entityIdMap.get(obs.norad_cat_id);
      if (!entityId) {
        continue;
      }

      // Skip observations without ground station position data
      if (obs.station_lat === null || obs.station_lng === null) {
        continue;
      }

      records.push({
        entityId,
        timestamp: new Date(obs.start),
        latitude: obs.station_lat,
        longitude: obs.station_lng,
        altitude: obs.station_alt ?? null,
        speed: null,
        heading: null,
        source: 'satnogs',
        raw: obs as unknown as Record<string, unknown>,
      });
    }

    return records;
  }

  /**
   * Insert position records in configurable batches to avoid
   * overwhelming the database with a single large insert.
   *
   * @param records - Position records to insert
   */
  private async insertPositionsBatch(records: NewPosition[]): Promise<void> {
    const batches = chunk(records, this.config.batchSize);

    this.logger.debug(
      { totalRecords: records.length, batchCount: batches.length },
      'Inserting SatNOGS positions in batches',
    );

    for (const batch of batches) {
      await this.db.db.insert(positions).values(batch);
    }
  }
}
