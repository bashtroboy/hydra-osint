/**
 * A single shortwave broadcast schedule entry from the EiBi database.
 *
 * Each record represents a scheduled broadcast on a specific frequency,
 * including time, language, target area, and transmitter site information.
 *
 * @see https://www.eibi.de
 */
export interface EibiBroadcast {
  /** Broadcast frequency in kHz. */
  frequency: number;
  /** Start time in UTC (HHMM format, e.g. "0000", "1430"). */
  timeStart: string;
  /** End time in UTC (HHMM format, e.g. "2400", "1500"). */
  timeEnd: string;
  /** Schedule days code (e.g. "daily", "Mo-Fr", "Sa,Su"). */
  days: string;
  /** Broadcasting station name. */
  station: string;
  /** Broadcast language (ITU language code or name). */
  language: string;
  /** Target area or region for the broadcast. */
  targetArea: string;
  /** Transmitter site / location remarks. */
  transmitterSite: string;
  /** Persistence code indicating schedule reliability. */
  persistence: string;
  /** Schedule start date (typically in MMDD or similar format). */
  startDate: string;
  /** Schedule end date. */
  endDate: string;
}
