/**
 * SatNOGS satellite transmitter as returned by the DB API.
 *
 * @see https://db.satnogs.org/api/transmitters/
 */
export interface SatnogsTransmitter {
  /** Unique transmitter identifier. */
  uuid: string;
  /** Human-readable transmitter description. */
  description: string;
  /** Whether this transmitter is currently active. */
  alive: boolean;
  /** Transmitter type (e.g. "Transceiver", "Transmitter", "Transponder"). */
  type: string;
  /** Lower uplink frequency in Hz, or null if not applicable. */
  uplink_low: number | null;
  /** Upper uplink frequency in Hz, or null if not applicable. */
  uplink_high: number | null;
  /** Lower downlink frequency in Hz, or null if not applicable. */
  downlink_low: number | null;
  /** Upper downlink frequency in Hz, or null if not applicable. */
  downlink_high: number | null;
  /** Modulation mode (e.g. "FM", "AFSK", "BPSK"). */
  mode: string | null;
  /** Whether the signal is inverted. */
  invert: boolean;
  /** Baud rate, or null if not applicable. */
  baud: number | null;
  /** NORAD catalog ID of the associated satellite. */
  norad_cat_id: number;
  /** Transmitter status string (e.g. "active", "inactive"). */
  status: string;
  /** ISO 8601 timestamp of the last update. */
  updated: string;
  /** Citation or source reference for this transmitter entry. */
  citation: string;
}

/**
 * SatNOGS observation as returned by the Network API.
 *
 * @see https://network.satnogs.org/api/observations/
 */
export interface SatnogsObservation {
  /** Unique observation identifier. */
  id: number;
  /** ISO 8601 start timestamp. */
  start: string;
  /** ISO 8601 end timestamp. */
  end: string;
  /** Ground station numeric identifier. */
  ground_station: number;
  /** Transmitter UUID associated with this observation. */
  transmitter: string;
  /** NORAD catalog ID of the observed satellite. */
  norad_cat_id: number;
  /** Observation status (e.g. "good", "bad", "unknown"). */
  status: string;
  /** URL to the waterfall image, or null. */
  waterfall: string | null;
  /** Demodulated data download URLs. */
  demoddata: string[];
  /** Name of the ground station. */
  station_name: string;
  /** Ground station latitude in decimal degrees. */
  station_lat: number | null;
  /** Ground station longitude in decimal degrees. */
  station_lng: number | null;
  /** Ground station altitude in metres. */
  station_alt: number | null;
  /** Vetted status (e.g. "good", "bad", "unknown", null). */
  vetted_status: string | null;
  /** User ID of the person who vetted, or null. */
  vetted_user: number | null;
  /** Whether this observation has been archived. */
  archived: boolean;
}

/**
 * SatNOGS satellite as returned by the DB API.
 *
 * @see https://db.satnogs.org/api/satellites/
 */
export interface SatnogsSatellite {
  /** NORAD catalog ID. */
  norad_cat_id: number;
  /** Primary satellite name. */
  name: string;
  /** Alternative names / designations. */
  names: string;
  /** URL to satellite image, or null. */
  image: string | null;
  /** Satellite operational status (e.g. "alive", "dead", "re-entered"). */
  status: string;
  /** Date the satellite decayed / re-entered, or null. */
  decayed: string | null;
  /** ISO 8601 launch date, or null. */
  launched: string | null;
  /** ISO 8601 deployment date, or null. */
  deployed: string | null;
  /** Satellite project website URL, or null. */
  website: string | null;
  /** Satellite operator name, or null. */
  operator: string | null;
  /** Country codes associated with this satellite. */
  countries: string;
  /** Telemetry decoder definitions. */
  telemetries: unknown[];
}
