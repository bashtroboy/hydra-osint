/**
 * A single WSPR (Weak Signal Propagation Reporter) spot as returned by the
 * WSPRnet JSON API.
 *
 * Each spot represents a decoded beacon reception, linking a transmitter
 * (CallSign / Grid) to a receiver (Reporter / ReporterGrid) on a specific
 * frequency and band.
 *
 * @see https://www.wsprnet.org
 */
export interface WsprSpot {
  /** Unique spot identifier. */
  Spotnum: number;
  /** Reception timestamp as a Unix epoch (seconds). */
  Date: number;
  /** Callsign of the receiving station. */
  Reporter: string;
  /** Maidenhead grid locator of the receiving station. */
  ReporterGrid: string;
  /** Signal-to-noise ratio in dB. */
  SNR: number;
  /** Transmit frequency in MHz. */
  Frequency: number;
  /** Callsign of the transmitting station. */
  CallSign: string;
  /** Maidenhead grid locator of the transmitting station. */
  Grid: string;
  /** Transmit power in dBm. */
  Power: number;
  /** Frequency drift in Hz. */
  Drift: number;
  /** Distance between transmitter and receiver in km. */
  Distance: number;
  /** Azimuth bearing from transmitter to receiver in degrees. */
  azimuth: number;
  /** Band identifier (e.g. 14 for 20m). */
  Band: number;
  /** Software version used by the reporter. */
  Version: string;
  /** Spot code / mode indicator. */
  Code: number;
}
