/** A geographic bounding box defined by its south-west and north-east corners. */
export interface BBox {
  /** Minimum latitude (south edge) */
  minLat: number;
  /** Minimum longitude (west edge) */
  minLon: number;
  /** Maximum latitude (north edge) */
  maxLat: number;
  /** Maximum longitude (east edge) */
  maxLon: number;
}

/**
 * Expands a bounding box by the given amount in degrees on each side.
 *
 * @param bbox - The original bounding box
 * @param degrees - Amount to expand in degrees (applied to all edges)
 * @returns A new expanded bounding box, clamped to valid coordinate ranges
 *
 * @example
 * ```ts
 * const expanded = expandBbox({ minLat: 50, minLon: -1, maxLat: 52, maxLon: 1 }, 0.5);
 * // { minLat: 49.5, minLon: -1.5, maxLat: 52.5, maxLon: 1.5 }
 * ```
 */
export function expandBbox(bbox: BBox, degrees: number): BBox {
  return {
    minLat: Math.max(-90, bbox.minLat - degrees),
    minLon: Math.max(-180, bbox.minLon - degrees),
    maxLat: Math.min(90, bbox.maxLat + degrees),
    maxLon: Math.min(180, bbox.maxLon + degrees),
  };
}

/**
 * Checks whether a geographic point lies within a bounding box.
 *
 * @param lat - Latitude of the point in decimal degrees
 * @param lon - Longitude of the point in decimal degrees
 * @param bbox - The bounding box to test against
 * @returns `true` if the point is inside the bounding box (inclusive)
 *
 * @example
 * ```ts
 * const bbox: BBox = { minLat: 50, minLon: -1, maxLat: 52, maxLon: 1 };
 * pointInBbox(51.5, -0.1, bbox); // true (London)
 * pointInBbox(48.8, 2.3, bbox);  // false (Paris)
 * ```
 */
export function pointInBbox(lat: number, lon: number, bbox: BBox): boolean {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lon >= bbox.minLon &&
    lon <= bbox.maxLon
  );
}
