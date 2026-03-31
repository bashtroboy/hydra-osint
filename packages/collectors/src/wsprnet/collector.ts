import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import type { DatabaseClient } from '@hydra/database';
import { events } from '@hydra/database';
import type { CollectorResult } from '../shared/types.js';
import type { WsprnetCollectorConfig } from './config.js';
import { WsprnetClient } from './client.js';
import type { WsprSpot } from './types.js';

/**
 * Convert a 4- or 6-character Maidenhead grid locator to approximate
 * latitude/longitude coordinates (centre of the grid square).
 *
 * @param grid - Maidenhead locator string (e.g. "FN31" or "FN31pr")
 * @returns Centre coordinates of the grid square, or `null` if the locator is invalid
 *
 * @example
 * ```ts
 * gridToLatLon('FN31');   // { latitude: 41.5, longitude: -72 }
 * gridToLatLon('FN31pr'); // { latitude: 41.9375, longitude: -71.208... }
 * ```
 */
export function gridToLatLon(grid: string): { latitude: number; longitude: number } | null {
  const trimmed = grid.trim().toUpperCase();

  if (trimmed.length !== 4 && trimmed.length !== 6) {
    return null;
  }

  const fieldLon = trimmed.charCodeAt(0) - 65; // A=0 .. R=17
  const fieldLat = trimmed.charCodeAt(1) - 65;
  const squareLon = Number(trimmed[2]);
  const squareLat = Number(trimmed[3]);

  if (
    fieldLon < 0 || fieldLon > 17 ||
    fieldLat < 0 || fieldLat > 17 ||
    Number.isNaN(squareLon) || Number.isNaN(squareLat)
  ) {
    return null;
  }

  // Each field is 20 degrees longitude, 10 degrees latitude
  // Each square is 2 degrees longitude, 1 degree latitude
  let longitude = fieldLon * 20 + squareLon * 2 - 180;
  let latitude = fieldLat * 10 + squareLat * 1 - 90;

  if (trimmed.length === 6) {
    const subLon = trimmed.charCodeAt(4) - 65; // a=0 .. x=23
    const subLat = trimmed.charCodeAt(5) - 65;

    if (subLon < 0 || subLon > 23 || subLat < 0 || subLat > 23) {
      return null;
    }

    // Each sub-square is 5 minutes (5/60 degrees) longitude, 2.5 minutes latitude
    longitude += subLon * (5 / 60) + (5 / 120);
    latitude += subLat * (2.5 / 60) + (2.5 / 120);
  } else {
    // Centre of the 2x1 degree square
    longitude += 1;
    latitude += 0.5;
  }

  return { latitude, longitude };
}

/**
 * WSPRnet data collector that fetches recent WSPR propagation spots,
 * converts grid locators to coordinates, and persists each spot as a
 * HYDRA event of type `wspr_spot`.
 *
 * @example
 * ```ts
 * const collector = new WsprnetCollector(config, dbClient);
 * const result = await collector.collect();
 * console.log(result.recordsProcessed);
 * ```
 */
export class WsprnetCollector {
  private readonly logger: Logger;
  private readonly client: WsprnetClient;
  private readonly db: DatabaseClient;

  /**
   * @param config - WSPRnet collector configuration
   * @param db     - HYDRA database client
   */
  constructor(config: WsprnetCollectorConfig, db: DatabaseClient) {
    this.logger = createLogger({ name: 'wsprnet-collector' });
    this.client = new WsprnetClient(config);
    this.db = db;
  }

  /**
   * Execute a single collection cycle:
   * 1. Fetch recent WSPR spots from the WSPRnet API
   * 2. Convert grid locators to approximate coordinates
   * 3. Store each spot as a `wspr_spot` event
   *
   * @returns A {@link CollectorResult} summarising the run
   */
  async collect(): Promise<CollectorResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    this.logger.info('Starting WSPRnet collection cycle');

    try {
      const spots = await this.client.fetchRecentSpots();

      if (spots.length === 0) {
        this.logger.info('No spots returned from WSPRnet');
        return { success: true, recordsProcessed: 0, errors: [] };
      }

      this.logger.info({ count: spots.length }, 'Fetched WSPRnet spots');

      for (const spot of spots) {
        try {
          await this.persistSpot(spot);
          recordsProcessed++;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          const msg = `Failed to persist spot ${spot.Spotnum}: ${message}`;
          errors.push(msg);
          this.logger.warn({ spotnum: spot.Spotnum, error: message }, 'Spot persistence failed');
        }
      }

      this.logger.info(
        { recordsProcessed, errorCount: errors.length },
        'WSPRnet collection cycle complete',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      this.logger.error({ error: message }, 'WSPRnet collection cycle failed');

      return { success: false, recordsProcessed, errors };
    }

    return { success: errors.length === 0, recordsProcessed, errors };
  }

  /**
   * Convert a WSPR spot to a HYDRA event and insert it into the database.
   *
   * The reporter grid locator is used for event coordinates when available.
   *
   * @param spot - A single WSPR spot record
   */
  private async persistSpot(spot: WsprSpot): Promise<void> {
    const reporterLocation = gridToLatLon(spot.ReporterGrid);
    const transmitterLocation = gridToLatLon(spot.Grid);

    await this.db.db.insert(events).values({
      type: 'wspr_spot',
      severity: 'info',
      title: `WSPR spot: ${spot.CallSign} → ${spot.Reporter}`,
      description: `WSPR beacon from ${spot.CallSign} (${spot.Grid}) received by ${spot.Reporter} (${spot.ReporterGrid}) on ${spot.Frequency} MHz, SNR ${spot.SNR} dB, distance ${spot.Distance} km`,
      latitude: reporterLocation?.latitude ?? null,
      longitude: reporterLocation?.longitude ?? null,
      startTime: new Date(spot.Date * 1000),
      metadata: {
        spotnum: spot.Spotnum,
        reporter: spot.Reporter,
        reporterGrid: spot.ReporterGrid,
        reporterLatitude: reporterLocation?.latitude ?? null,
        reporterLongitude: reporterLocation?.longitude ?? null,
        callSign: spot.CallSign,
        transmitterGrid: spot.Grid,
        transmitterLatitude: transmitterLocation?.latitude ?? null,
        transmitterLongitude: transmitterLocation?.longitude ?? null,
        snr: spot.SNR,
        frequency: spot.Frequency,
        power: spot.Power,
        drift: spot.Drift,
        distance: spot.Distance,
        azimuth: spot.azimuth,
        band: spot.Band,
        version: spot.Version,
        code: spot.Code,
      },
    });
  }
}
