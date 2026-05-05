import type { Logger } from 'pino';
import { eq, and } from 'drizzle-orm';
import { createLogger, chunk } from '@hydra/core';
import type { DatabaseClient, NewPosition } from '@hydra/database';
import { entities, positions } from '@hydra/database';
import type { CollectorResult } from '../shared/types.js';
import type { SondehubCollectorConfig } from './config.js';
import { SondehubClient } from './client.js';
import type { SondehubTelemetry } from './types.js';

/**
 * Radiosonde data collector that fetches active weather balloon telemetry
 * from the SondeHub API, upserts radiosonde entities, and persists
 * position records to the HYDRA database.
 *
 * @example
 * ```ts
 * const collector = new SondehubCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class SondehubCollector {
  private readonly logger: Logger;
  private readonly client: SondehubClient;
  private readonly config: SondehubCollectorConfig;
  private readonly db: DatabaseClient;

  /**
   * @param config - SondeHub collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: SondehubCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'sondehub-collector' });
    this.config = config;
    this.client = new SondehubClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. Fetch active sondes from the SondeHub API
   * 2. Upsert each radiosonde as an entity
   * 3. Insert position records with lat/lon/alt/speed/heading
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info('Starting SondeHub collection cycle');

    try {
      const sondeMap = await this.client.fetchSondes(this.config.duration);
      const sondes = Object.values(sondeMap);

      if (sondes.length === 0) {
        this.logger.info('No active sondes returned from SondeHub');
        return { success: true, recordsProcessed: 0, errors: [] };
      }

      this.logger.info({ count: sondes.length }, 'Processing active sondes');

      // Upsert entities and collect entity IDs for position inserts
      const entityIdMap = await this.upsertEntities(sondes, errors);

      // Build position records for sondes that have location data
      const positionRecords = this.buildPositionRecords(sondes, entityIdMap);

      // Batch insert positions
      if (positionRecords.length > 0) {
        await this.insertPositionsBatch(positionRecords);
        recordsProcessed = positionRecords.length;
      }

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'SondeHub collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'SondeHub collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Upsert radiosonde entities for each unique serial in the telemetry batch.
   *
   * @param sondes - Array of sonde telemetry records
   * @param errors - Mutable error list to accumulate non-fatal failures
   * @returns Map of serial -> entity UUID
   */
  private async upsertEntities(
    sondes: SondehubTelemetry[],
    errors: string[],
  ): Promise<Map<string, string>> {
    const entityIdMap = new Map<string, string>();

    // De-duplicate by serial — keep the most recent telemetry entry
    const uniqueBySerial = new Map<string, SondehubTelemetry>();
    for (const sonde of sondes) {
      const existing = uniqueBySerial.get(sonde.serial);
      if (!existing || sonde.datetime > existing.datetime) {
        uniqueBySerial.set(sonde.serial, sonde);
      }
    }

    for (const [serial, sonde] of uniqueBySerial) {
      try {
        // Try to find existing entity
        const existing = await this.db.db
          .select({ id: entities.id })
          .from(entities)
          .where(
            and(
              eq(entities.type, 'radiosonde'),
              eq(entities.identifier, serial),
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          // Update lastSeen
          await this.db.db
            .update(entities)
            .set({
              lastSeen: new Date(),
              metadata: this.buildEntityMetadata(sonde),
              updatedAt: new Date(),
            })
            .where(eq(entities.id, existing[0].id));

          entityIdMap.set(serial, existing[0].id);
        } else {
          // Insert new entity
          const inserted = await this.db.db
            .insert(entities)
            .values({
              type: 'radiosonde',
              identifier: serial,
              name: serial,
              metadata: this.buildEntityMetadata(sonde),
            })
            .returning({ id: entities.id });

          if (inserted[0]) {
            entityIdMap.set(serial, inserted[0].id);
          }
        }
      } catch (error: unknown) {
        const msg = `Failed to upsert entity ${serial}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(msg);
        this.logger.warn({ serial, error: msg }, 'Entity upsert failed');
      }
    }

    this.logger.debug({ entityCount: entityIdMap.size }, 'Entities upserted');
    return entityIdMap;
  }

  /**
   * Build metadata object for a radiosonde entity from telemetry data.
   *
   * @param sonde - Sonde telemetry record
   * @returns Metadata record for the entity
   */
  private buildEntityMetadata(
    sonde: SondehubTelemetry,
  ): Record<string, unknown> {
    return {
      entityType: 'radiosonde',
      sondeType: sonde.type,
      sondeTypeCode: sonde.sonde_type,
      subtype: sonde.subtype,
      manufacturer: sonde.manufacturer,
      frequency: sonde.frequency,
    };
  }

  /**
   * Build position insert records for sondes that have valid lat/lon data.
   *
   * @param sondes      - Sonde telemetry records
   * @param entityIdMap - Map of serial -> entity UUID
   * @returns Array of position records ready for insertion
   */
  private buildPositionRecords(
    sondes: SondehubTelemetry[],
    entityIdMap: Map<string, string>,
  ): NewPosition[] {
    const records: NewPosition[] = [];

    for (const sonde of sondes) {
      const entityId = entityIdMap.get(sonde.serial);
      if (!entityId) {
        continue;
      }

      // Skip sondes without position data
      if (sonde.lat === null || sonde.lon === null) {
        continue;
      }

      records.push({
        entityId,
        timestamp: new Date(sonde.datetime),
        latitude: sonde.lat,
        longitude: sonde.lon,
        altitude: sonde.alt ?? null,
        speed: sonde.vel_h ?? null,
        heading: sonde.heading ?? null,
        source: 'sondehub',
        raw: sonde as unknown as Record<string, unknown>,
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
