export type {
  OpenSkyState,
  OpenSkyResponse,
} from '@hydra/schemas';

/**
 * Raw state vector array as returned by the OpenSky Network API.
 *
 * The API returns each state as a positional array rather than an object.
 * Index mapping follows the OpenSky REST documentation.
 *
 * @see https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors
 */
export type OpenSkyRawStateVector = [
  icao24: string,
  callsign: string | null,
  origin_country: string,
  time_position: number | null,
  last_contact: number,
  longitude: number | null,
  latitude: number | null,
  baro_altitude: number | null,
  on_ground: boolean,
  velocity: number | null,
  true_track: number | null,
  vertical_rate: number | null,
  sensors: number[] | null,
  geo_altitude: number | null,
  squawk: string | null,
  spi: boolean,
  position_source: number,
];

/** Shape of the raw JSON response from /api/states/all. */
export interface OpenSkyRawResponse {
  time: number;
  states: OpenSkyRawStateVector[] | null;
}
