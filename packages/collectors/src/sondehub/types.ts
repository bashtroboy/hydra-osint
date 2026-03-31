/**
 * Telemetry data for a single radiosonde as returned by the SondeHub API.
 *
 * Not all sondes report every field, so most numeric values are nullable.
 *
 * @see https://github.com/projecthorus/sondehub-infra/wiki/API
 */
export interface SondehubTelemetry {
  /** Unique serial number of the radiosonde. */
  serial: string;
  /** ISO-8601 timestamp of the telemetry frame. */
  datetime: string;
  /** Latitude in decimal degrees. */
  lat: number | null;
  /** Longitude in decimal degrees. */
  lon: number | null;
  /** Altitude in metres above sea level. */
  alt: number | null;
  /** Horizontal velocity in m/s. */
  vel_h: number | null;
  /** Vertical velocity in m/s (positive = ascending). */
  vel_v: number | null;
  /** Heading in degrees (0-360). */
  heading: number | null;
  /** Telemetry frame number. */
  frame: number | null;
  /** Sonde type identifier (e.g. 'RS41', 'DFM09'). */
  type: string | null;
  /** Transmit frequency in MHz. */
  frequency: number | null;
  /** Temperature in degrees Celsius. */
  temp: number | null;
  /** Relative humidity as a percentage. */
  humidity: number | null;
  /** Atmospheric pressure in hPa. */
  pressure: number | null;
  /** Manufacturer name (e.g. 'Vaisala', 'Graw'). */
  manufacturer: string | null;
  /** Burst timer value in seconds, if reported. */
  burst_timer: number | null;
  /** Numeric sonde type code. */
  sonde_type: number | null;
  /** Sonde subtype identifier. */
  subtype: string | null;
}
