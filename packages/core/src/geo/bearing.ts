/**
 * Calculates the initial bearing (forward azimuth) from point 1 to point 2
 * using the spherical law of cosines.
 *
 * @param lat1 - Latitude of point 1 in decimal degrees
 * @param lon1 - Longitude of point 1 in decimal degrees
 * @param lat2 - Latitude of point 2 in decimal degrees
 * @param lon2 - Longitude of point 2 in decimal degrees
 * @returns Bearing in degrees (0-360, where 0 = north, 90 = east)
 *
 * @example
 * ```ts
 * const b = calculateBearing(51.5074, -0.1278, 48.8566, 2.3522);
 * // ~148 degrees (London to Paris, roughly south-east)
 * ```
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const toDeg = (rad: number): number => (rad * 180) / Math.PI;

  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x =
    Math.cos(rLat1) * Math.sin(rLat2) -
    Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));

  // Normalise to 0-360
  return ((bearing % 360) + 360) % 360;
}
