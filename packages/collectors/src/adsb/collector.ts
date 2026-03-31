import type { Logger } from 'pino';
import { eq, and } from 'drizzle-orm';
import { createLogger, chunk } from '@hydra/core';
import type { DatabaseClient, NewPosition } from '@hydra/database';
import { entities, positions } from '@hydra/database';
import { openSkyStateSchema } from '@hydra/schemas';
import type { OpenSkyState } from '@hydra/schemas';
import type { CollectorResult } from '../shared/types.js';
import type { AdsbCollectorConfig } from './config.js';
import { OpenSkyClient } from './client.js';

/**
 * ADS-B data collector that fetches aircraft state vectors from the
 * OpenSky Network, validates them, and persists entities and positions
 * to the HYDRA database.
 *
 * @example
 * ```ts
 * const collector = new AdsbCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class AdsbCollector {
  private readonly logger: Logger;
  private readonly client: OpenSkyClient;
  private readonly config: AdsbCollectorConfig;
  private readonly db: DatabaseClient;

  /**
   * @param config - ADS-B collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: AdsbCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'adsb-collector' });
    this.config = config;
    this.client = new OpenSkyClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. Fetch state vectors from OpenSky
   * 2. Validate each state with Zod
   * 3. Upsert aircraft entities
   * 4. Batch-insert position records
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info('Starting ADS-B collection cycle');

    try {
      const rawStates = await this.client.fetchAllStates(this.config.boundingBox);

      if (rawStates.length === 0) {
        this.logger.info('No states returned from OpenSky');
        return { success: true, recordsProcessed: 0, errors: [] };
      }

      // Validate each state through the Zod schema
      const validStates: OpenSkyState[] = [];
      for (const state of rawStates) {
        const result = openSkyStateSchema.safeParse(state);
        if (result.success) {
          validStates.push(result.data);
        } else {
          const msg = `Validation failed for ${state.icao24}: ${result.error.message}`;
          errors.push(msg);
          this.logger.warn({ icao24: state.icao24 }, msg);
        }
      }

      this.logger.info(
        { total: rawStates.length, valid: validStates.length },
        'Validated OpenSky states',
      );

      // Upsert entities and collect entity IDs for position inserts
      const entityIdMap = await this.upsertEntities(validStates, errors);

      // Build position records for states that have location data
      const positionRecords = this.buildPositionRecords(validStates, entityIdMap);

      // Batch insert positions
      if (positionRecords.length > 0) {
        await this.insertPositionsBatch(positionRecords);
        recordsProcessed = positionRecords.length;
      }

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'ADS-B collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'ADS-B collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Upsert aircraft entities for each unique ICAO address in the state batch.
   *
   * @param states - Validated OpenSky state vectors
   * @param errors - Mutable error list to accumulate non-fatal failures
   * @returns Map of icao24 -> entity UUID
   */
  private async upsertEntities(
    states: OpenSkyState[],
    errors: string[],
  ): Promise<Map<string, string>> {
    const entityIdMap = new Map<string, string>();

    // De-duplicate by icao24 — keep the most recently contacted entry
    const uniqueByIcao = new Map<string, OpenSkyState>();
    for (const state of states) {
      const existing = uniqueByIcao.get(state.icao24);
      if (!existing || state.last_contact > existing.last_contact) {
        uniqueByIcao.set(state.icao24, state);
      }
    }

    for (const [icao24, state] of uniqueByIcao) {
      try {
        // Try to find existing entity
        const existing = await this.db.db
          .select({ id: entities.id })
          .from(entities)
          .where(
            and(
              eq(entities.type, 'aircraft'),
              eq(entities.identifier, icao24),
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          // Update lastSeen
          await this.db.db
            .update(entities)
            .set({
              lastSeen: new Date(),
              name: state.callsign ?? undefined,
              metadata: {
                originCountry: state.origin_country,
                onGround: state.on_ground,
                squawk: state.squawk,
              },
              updatedAt: new Date(),
            })
            .where(eq(entities.id, existing[0].id));

          entityIdMap.set(icao24, existing[0].id);
        } else {
          // Insert new entity
          const inserted = await this.db.db
            .insert(entities)
            .values({
              type: 'aircraft',
              identifier: icao24,
              name: state.callsign ?? null,
              metadata: {
                originCountry: state.origin_country,
                onGround: state.on_ground,
                squawk: state.squawk,
              },
            })
            .returning({ id: entities.id });

          if (inserted[0]) {
            entityIdMap.set(icao24, inserted[0].id);
          }
        }
      } catch (error: unknown) {
        const msg = `Failed to upsert entity ${icao24}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(msg);
        this.logger.warn({ icao24, error: msg }, 'Entity upsert failed');
      }
    }

    this.logger.debug({ entityCount: entityIdMap.size }, 'Entities upserted');
    return entityIdMap;
  }

  /**
   * Build position insert records for states that have valid lat/lon data.
   *
   * @param states     - Validated state vectors
   * @param entityIdMap - Map of icao24 -> entity UUID
   * @returns Array of position records ready for insertion
   */
  private buildPositionRecords(
    states: OpenSkyState[],
    entityIdMap: Map<string, string>,
  ): NewPosition[] {
    const records: NewPosition[] = [];

    for (const state of states) {
      const entityId = entityIdMap.get(state.icao24);
      if (!entityId) {
        continue;
      }

      // Skip states without position data
      if (state.latitude === null || state.longitude === null) {
        continue;
      }

      records.push({
        entityId,
        timestamp: state.time_position
          ? new Date(state.time_position * 1000)
          : new Date(),
        latitude: state.latitude,
        longitude: state.longitude,
        altitude: state.baro_altitude ?? state.geo_altitude ?? null,
        speed: state.velocity ?? null,
        heading: state.true_track ?? null,
        source: 'opensky',
        raw: state as unknown as Record<string, unknown>,
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
      'Inserting positions in batches',
    );

    for (const batch of batches) {
      await this.db.db.insert(positions).values(batch);
    }
  }
}
