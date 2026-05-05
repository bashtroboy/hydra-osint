/** Source entry within an OpenMHz call, representing a radio source transmission. */
export interface OpenmhzSrcEntry {
  /** Radio source identifier */
  src: number;
  /** Position within the call */
  pos: number;
  /** Unix timestamp of the source transmission */
  time: number;
}

/**
 * A single trunked radio call as returned by the OpenMHz API.
 *
 * @see https://github.com/robotastic/trunk-server
 */
export interface OpenmhzCall {
  /** Unique call identifier */
  _id: string;
  /** Numeric talkgroup identifier */
  talkgroupNum: number;
  /** Human-readable talkgroup description, if available */
  talkgroupDescription?: string;
  /** System short name this call belongs to */
  shortName: string;
  /** Frequency in Hz */
  freq: number;
  /** List of radio sources that transmitted during this call */
  srcList: OpenmhzSrcEntry[];
  /** ISO 8601 timestamp when the call started */
  startTime: string;
  /** ISO 8601 timestamp when the call ended */
  stopTime: string;
  /** Duration of the call in seconds */
  len: number;
  /** URL to the recorded audio file */
  url: string;
}

/**
 * A trunked radio system registered on the OpenMHz platform.
 */
export interface OpenmhzSystem {
  /** Full human-readable name of the system */
  name: string;
  /** Short identifier used in API URLs */
  shortName: string;
  /** Description of the system */
  description: string;
  /** Type of trunking system (e.g. "P25", "SmartNet") */
  systemType: string;
  /** City where the system is located */
  city: string;
  /** State where the system is located */
  state: string;
  /** County where the system is located */
  county: string;
}
