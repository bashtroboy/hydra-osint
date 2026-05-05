/** A known numbers station tracked by Priyom.org. */
export interface PriyomStation {
  /** Human-readable station name (e.g. "The Buzzer"). */
  name: string;
  /** ENIGMA / Priyom designator code (e.g. "E06", "S06", "V07"). */
  designator: string;
  /** Country of suspected origin, if known. */
  country?: string;
  /** Language used in transmissions, if applicable. */
  language?: string;
  /** Known operating frequencies in kHz. */
  frequencies: number[];
  /** Brief description of the station and its characteristics. */
  description?: string;
  /** Current operational status. */
  status?: 'active' | 'inactive' | 'unknown';
}

/** A scheduled transmission entry for a numbers station. */
export interface PriyomScheduleEntry {
  /** Name of the station. */
  stationName: string;
  /** ENIGMA / Priyom designator code. */
  designator: string;
  /** Transmission frequency in kHz. */
  frequency: number;
  /** Scheduled transmission time in UTC (e.g. "21:00"). */
  time: string;
  /** Day of the week for recurring schedules. */
  dayOfWeek?: string;
  /** Additional notes about the schedule entry. */
  notes?: string;
}

/** A logged reception of a numbers station transmission. */
export interface PriyomLogEntry {
  /** ISO-8601 timestamp of the reception. */
  timestamp: string;
  /** Name of the station heard. */
  stationName: string;
  /** Frequency in kHz the transmission was received on. */
  frequency: number;
  /** Transmission mode (e.g. "USB", "AM", "CW"). */
  mode?: string;
  /** Content or summary of the transmission. */
  content?: string;
  /** Callsign or name of the person who reported the reception. */
  reporter?: string;
}
