/**
 * Comprehensive demo seed data for the HYDRA OSINT platform.
 *
 * Provides realistic entities, positions, events, and data sources
 * so the API can serve meaningful responses without a database.
 * All timestamps are relative to `Date.now()` so data always looks fresh.
 *
 * @module demo/seed-data
 */

import type { DemoEntity, DemoPosition, DemoEvent, DemoDataSource } from './demo-db.js';

const NOW = Date.now();
const minsAgo = (m: number): Date => new Date(NOW - m * 60_000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a position trail along a linear path. */
function trail(
  entityId: string,
  startLat: number,
  startLon: number,
  dLat: number,
  dLon: number,
  count: number,
  opts: { alt?: number; speed?: number; heading?: number; source: string; startMin?: number },
): DemoPosition[] {
  const base = opts.startMin ?? 120;
  return Array.from({ length: count }, (_, i): DemoPosition => ({
    id: `p-${entityId.slice(0, 8)}-${String(i).padStart(2, '0')}`,
    entityId,
    timestamp: minsAgo(base - i * Math.floor(base / count)),
    latitude: +(startLat + dLat * (i / count)).toFixed(5),
    longitude: +(startLon + dLon * (i / count)).toFixed(5),
    altitude: opts.alt !== undefined ? opts.alt + (i % 3 - 1) * 100 : null,
    speed: opts.speed ?? null,
    heading: opts.heading ?? null,
    source: opts.source,
    raw: null,
  }));
}

/** Shorthand entity builder. */
function ent(
  id: string,
  type: string,
  identifier: string,
  name: string | null,
  metadata: unknown,
  seenMin = 5,
): DemoEntity {
  return {
    id, type, identifier, name, metadata,
    firstSeen: minsAgo(1440), lastSeen: minsAgo(seenMin),
    createdAt: minsAgo(1440), updatedAt: minsAgo(seenMin),
  };
}

// ---------------------------------------------------------------------------
// Stable entity IDs
// ---------------------------------------------------------------------------

const ID = {
  af1:      'a1b2c3d4-1111-4aaa-b111-000000000001',
  ryr737:   'a1b2c3d4-2222-4aaa-b222-000000000002',
  c130:     'a1b2c3d4-3333-4aaa-b333-000000000003',
  uscg:     'a1b2c3d4-4444-4aaa-b444-000000000004',
  ghost:    'a1b2c3d4-5555-4aaa-b555-000000000005',
  a320:     'a1b2c3d4-6666-4aaa-b666-000000000006',
  awacs:    'a1b2c3d4-7777-4aaa-b777-000000000007',
  cessna:   'a1b2c3d4-8888-4aaa-b888-000000000008',
  maersk:   'a1b2c3d4-9999-4aaa-b999-000000000009',
  tanker:   'a1b2c3d4-aaaa-4aaa-baaa-00000000000a',
  fishing:  'a1b2c3d4-bbbb-4aaa-bbbb-00000000000b',
  ddg:      'a1b2c3d4-cccc-4aaa-bccc-00000000000c',
  yantar:   'a1b2c3d4-dddd-4aaa-bddd-00000000000d',
  yacht:    'a1b2c3d4-eeee-4aaa-beee-00000000000e',
  rs1:      'a1b2c3d4-ff01-4aaa-bf01-00000000000f',
  rs2:      'a1b2c3d4-ff02-4aaa-bf02-000000000010',
  rs3:      'a1b2c3d4-ff03-4aaa-bf03-000000000011',
  rs4:      'a1b2c3d4-ff04-4aaa-bf04-000000000012',
  iss:      'a1b2c3d4-ff05-4aaa-bf05-000000000013',
  starlink: 'a1b2c3d4-ff06-4aaa-bf06-000000000014',
  goes18:   'a1b2c3d4-ff07-4aaa-bf07-000000000015',
  nrol:     'a1b2c3d4-ff08-4aaa-bf08-000000000016',
  asn1:     'a1b2c3d4-ff09-4aaa-bf09-000000000017',
  asn2:     'a1b2c3d4-ff0a-4aaa-bf0a-000000000018',
  quake:    'a1b2c3d4-ff0b-4aaa-bf0b-000000000019',
} as const;

// ---------------------------------------------------------------------------
// DEMO_ENTITIES (25)
// ---------------------------------------------------------------------------

export const DEMO_ENTITIES: readonly DemoEntity[] = [
  // Aircraft (8)
  ent(ID.af1,    'aircraft', 'ADFDF8', 'SAM38 (Air Force One)',        { callsign: 'SAM38', originCountry: 'United States', onGround: false, squawk: '0100' }),
  ent(ID.ryr737, 'aircraft', '4B1A3E', 'RYR25MG (Ryanair 737)',       { callsign: 'RYR25MG', originCountry: 'Ireland', onGround: false, squawk: '7700' }, 2),
  ent(ID.c130,   'aircraft', 'AE01CE', 'HERKY42 (C-130J Hercules)',    { callsign: 'HERKY42', originCountry: 'United States', onGround: false, squawk: '4512' }),
  ent(ID.uscg,   'aircraft', 'A00032', 'USCG6501 (MH-60 Jayhawk)',    { callsign: 'USCG6501', originCountry: 'United States', onGround: false, squawk: '1200' }),
  ent(ID.ghost,  'aircraft', '000000', null,                           { callsign: null, originCountry: null, onGround: false, squawk: '7500' }, 1),
  ent(ID.a320,   'aircraft', '3C4A6B', 'DLH4WA (Lufthansa A320)',     { callsign: 'DLH4WA', originCountry: 'Germany', onGround: false, squawk: '2541' }),
  ent(ID.awacs,  'aircraft', 'AE0441', 'NATO01 (E-3A Sentry AWACS)',   { callsign: 'NATO01', originCountry: 'NATO', onGround: false, squawk: '6120' }),
  ent(ID.cessna, 'aircraft', 'A12F4C', 'N172SP (Cessna 172)',          { callsign: 'N172SP', originCountry: 'United States', onGround: true, squawk: '1200' }),
  // Vessels (6)
  ent(ID.maersk, 'vessel', '219018622', 'MAERSK EDINBURGH',  { mmsi: '219018622', flag: 'DK', shipType: 'Container Ship', destination: 'SGSIN' }),
  ent(ID.tanker, 'vessel', '538009753', 'MINERVA HELEN',     { mmsi: '538009753', flag: 'MH', shipType: 'Crude Oil Tanker', destination: 'CNSHA' }),
  ent(ID.fishing,'vessel', '412331340', 'YU FENG 816',       { mmsi: '412331340', flag: 'CN', shipType: 'Fishing', destination: null }),
  ent(ID.ddg,    'vessel', '369970000', 'USS ARLEIGH BURKE', { mmsi: '369970000', flag: 'US', shipType: 'Naval', destination: null }),
  ent(ID.yantar, 'vessel', '273412300', 'YANTAR',            { mmsi: '273412300', flag: 'RU', shipType: 'Research', destination: null }, 3),
  ent(ID.yacht,  'vessel', '319130600', 'DILBAR',            { mmsi: '319130600', flag: 'CY', shipType: 'Yacht', destination: 'MTMLA' }),
  // Radiosondes (4)
  ent(ID.rs1, 'radiosonde', 'S4130987', 'Vaisala RS41-SG #987',  { manufacturer: 'Vaisala', model: 'RS41-SG', launchSite: 'Lindenberg, DE' }),
  ent(ID.rs2, 'radiosonde', 'S4131542', 'Vaisala RS41-SG #542',  { manufacturer: 'Vaisala', model: 'RS41-SG', launchSite: 'Herstmonceux, UK' }),
  ent(ID.rs3, 'radiosonde', 'G2280114', 'GRAW DFM-17 #114',     { manufacturer: 'GRAW', model: 'DFM-17', launchSite: 'Munich, DE' }),
  ent(ID.rs4, 'radiosonde', 'S4440052', 'Vaisala RS41-SGP #052', { manufacturer: 'Vaisala', model: 'RS41-SGP', launchSite: 'Fairbanks, AK' }),
  // Satellites (4)
  ent(ID.iss,     'satellite', '25544', 'ISS (ZARYA)',        { noradId: 25544, orbitType: 'LEO', inclination: 51.6, period: 92.9 }),
  ent(ID.starlink,'satellite', '56170', 'STARLINK-5301',     { noradId: 56170, orbitType: 'LEO', inclination: 53.2, period: 95.6 }),
  ent(ID.goes18,  'satellite', '51850', 'GOES-18',           { noradId: 51850, orbitType: 'GEO', inclination: 0.04, period: 1436.1 }),
  ent(ID.nrol,    'satellite', '58352', 'USA-326 (NROL-87)', { noradId: 58352, orbitType: 'SSO', inclination: 97.4, classified: true }),
  // Network & Seismic (3)
  ent(ID.asn1,  'network', 'AS15169',    'Google LLC',                      { asn: 15169, prefixCount: 1820, country: 'US' }),
  ent(ID.asn2,  'network', 'AS4837',     'China Unicom Backbone',           { asn: 4837, prefixCount: 920, country: 'CN' }),
  ent(ID.quake, 'seismic', 'us7000m1qz', 'M5.2 - 120km SE of Adak, Alaska',{ magnitude: 5.2, depth: 34.6, tsunamiWarning: false }),
] as const;

// ---------------------------------------------------------------------------
// DEMO_POSITIONS (108 total)
// ---------------------------------------------------------------------------

export const DEMO_POSITIONS: readonly DemoPosition[] = [
  // AF1: DC heading east over Atlantic
  ...trail(ID.af1, 38.9, -77.0, 8, -20, 12, { alt: 39000, speed: 245, heading: 65, source: 'opensky' }),
  // RYR 737 squawk 7700: descending over southern England
  ...trail(ID.ryr737, 51.1, -0.8, -0.3, 1.2, 10, { alt: 12000, speed: 140, heading: 110, source: 'opensky' }),
  // C-130: eastern Mediterranean
  ...trail(ID.c130, 34.0, 33.0, 2, 3, 10, { alt: 22000, speed: 155, heading: 45, source: 'opensky' }),
  // USCG helo: off Cape Cod
  ...trail(ID.uscg, 41.7, -70.0, -0.2, -0.8, 8, { alt: 500, speed: 60, heading: 210, source: 'opensky' }),
  // Ghost aircraft: Arctic, erratic
  ...trail(ID.ghost, 71.5, 25.0, -0.5, 8, 8, { alt: 36000, speed: 230, heading: 90, source: 'opensky' }),
  // Lufthansa A320: Frankfurt to London
  ...trail(ID.a320, 50.0, 8.5, 1.3, -7.5, 10, { alt: 37000, speed: 225, heading: 300, source: 'opensky' }),
  // NATO AWACS: orbiting over Poland
  ...trail(ID.awacs, 52.0, 20.0, 0.4, 0.8, 12, { alt: 30000, speed: 190, heading: 30, source: 'opensky' }),
  // Maersk: Strait of Malacca
  ...trail(ID.maersk, 1.3, 103.8, 1.5, -0.2, 10, { alt: 0, speed: 10, heading: 340, source: 'aishub' }),
  // Tanker: South China Sea
  ...trail(ID.tanker, 18.0, 115.0, 3, 5, 8, { alt: 0, speed: 12, heading: 45, source: 'aishub' }),
  // Fishing fleet: Yellow Sea loitering
  ...trail(ID.fishing, 35.0, 123.5, 0.1, 0.15, 8, { alt: 0, speed: 3, heading: 75, source: 'aishub' }),
  // Yantar: off Ireland near subsea cables
  ...trail(ID.yantar, 51.8, -14.0, -0.1, 0.3, 10, { alt: 0, speed: 4, heading: 100, source: 'aishub' }),
  // Radiosonde 1: ascending from Lindenberg
  ...trail(ID.rs1, 52.21, 14.12, 0.3, 0.8, 10, { source: 'sondehub', startMin: 90 })
    .map((p, i): DemoPosition => ({ ...p, altitude: i * 3200, speed: 5, heading: 60 })),
  // Seismic event: single position
  {
    id: `p-${ID.quake.slice(0, 8)}-00`, entityId: ID.quake,
    timestamp: minsAgo(70), latitude: 51.1, longitude: -175.8,
    altitude: -34600, speed: null, heading: null, source: 'usgs', raw: null,
  },
] as const;

// ---------------------------------------------------------------------------
// DEMO_EVENTS (15)
// ---------------------------------------------------------------------------

export const DEMO_EVENTS: readonly DemoEvent[] = [
  {
    id: 'ev000001-0001-4eee-a001-000000000001', type: 'anomaly', severity: 'critical',
    title: 'Squawk 7700 — emergency declared',
    description: 'Aircraft 4B1A3E (RYR25MG) transmitting emergency squawk at FL120 descending near Gatwick.',
    latitude: 51.0, longitude: 0.1, radius: 50000,
    startTime: minsAgo(8), endTime: null,
    metadata: { entityId: ID.ryr737, squawk: '7700' }, createdAt: minsAgo(8),
  },
  {
    id: 'ev000001-0002-4eee-a002-000000000002', type: 'anomaly', severity: 'high',
    title: 'Squawk 7500 — hijack code detected',
    description: 'Unidentified aircraft 000000 transmitting hijack squawk over northern Norway.',
    latitude: 71.3, longitude: 28.0, radius: 80000,
    startTime: minsAgo(15), endTime: null,
    metadata: { entityId: ID.ghost, squawk: '7500' }, createdAt: minsAgo(15),
  },
  {
    id: 'ev000001-0003-4eee-a003-000000000003', type: 'correlation', severity: 'high',
    title: 'Russian research vessel near subsea cable route',
    description: 'YANTAR (RU) loitering within 5 nm of AEConnect-1 transatlantic cable west of Ireland.',
    latitude: 51.7, longitude: -13.8, radius: 10000,
    startTime: minsAgo(45), endTime: null,
    metadata: { entityId: ID.yantar, cableId: 'AEConnect-1' }, createdAt: minsAgo(45),
  },
  {
    id: 'ev000001-0004-4eee-a004-000000000004', type: 'geofence', severity: 'medium',
    title: 'Entity entered ADIZ — Alaska',
    description: 'Unidentified aircraft entered the Alaska Air Defense Identification Zone near Adak Island.',
    latitude: 71.2, longitude: 30.0, radius: 200000,
    startTime: minsAgo(22), endTime: null,
    metadata: { entityId: ID.ghost, zone: 'AK-ADIZ' }, createdAt: minsAgo(22),
  },
  {
    id: 'ev000001-0005-4eee-a005-000000000005', type: 'correlation', severity: 'medium',
    title: 'Naval vessel and AWACS co-located — eastern Med',
    description: 'USS Arleigh Burke and NATO01 E-3A operating in proximity east of Cyprus.',
    latitude: 35.0, longitude: 34.5, radius: 100000,
    startTime: minsAgo(30), endTime: null,
    metadata: { entityIds: [ID.ddg, ID.awacs] }, createdAt: minsAgo(30),
  },
  {
    id: 'ev000001-0006-4eee-a006-000000000006', type: 'radio_call', severity: 'medium',
    title: 'Emergency dispatch — Structure fire',
    description: '3-alarm structure fire: Engine 7 / Ladder 3 / BC2. Tapped from OpenMHz Chicago Fire.',
    latitude: 41.878, longitude: -87.635, radius: 500,
    startTime: minsAgo(12), endTime: null,
    metadata: { source: 'openmhz', talkgroup: 'CFD-Dispatch', system: 'Chicago Fire' }, createdAt: minsAgo(12),
  },
  {
    id: 'ev000001-0007-4eee-a007-000000000007', type: 'wspr_spot', severity: 'low',
    title: 'HF propagation anomaly on 20m band',
    description: 'WSPR spot DL3EL to VK2RG on 14 MHz at -28 dB SNR — unusual path indicating ionospheric disturbance.',
    latitude: null, longitude: null, radius: null,
    startTime: minsAgo(18), endTime: null,
    metadata: { txCall: 'DL3EL', rxCall: 'VK2RG', frequency: 14.097, snr: -28 }, createdAt: minsAgo(18),
  },
  {
    id: 'ev000001-0008-4eee-a008-000000000008', type: 'numbers_station_schedule', severity: 'medium',
    title: 'V07 (UVB-76) frequency change detected',
    description: 'The Buzzer on 4625 kHz deviated from normal pattern — possible voice message at xx:35.',
    latitude: 56.08, longitude: 37.12, radius: null,
    startTime: minsAgo(40), endTime: minsAgo(38),
    metadata: { station: 'UVB-76', designation: 'V07', frequency: 4625 }, createdAt: minsAgo(40),
  },
  {
    id: 'ev000001-0009-4eee-a009-000000000009', type: 'shortwave_broadcast', severity: 'info',
    title: 'Unusual schedule change — Radio Pyongyang',
    description: 'Radio Pyongyang deviated from published schedule on 6400 kHz; extra 15-min segment.',
    latitude: 39.0, longitude: 125.75, radius: null,
    startTime: minsAgo(55), endTime: minsAgo(40),
    metadata: { station: 'Radio Pyongyang', frequency: 6400, language: 'Korean' }, createdAt: minsAgo(55),
  },
  {
    id: 'ev000001-000a-4eee-a00a-00000000000a', type: 'seismic', severity: 'medium',
    title: 'M5.2 earthquake — 120 km SE of Adak, Alaska',
    description: 'Shallow earthquake at 34.6 km depth. No tsunami warning issued.',
    latitude: 51.1, longitude: -175.8, radius: 50000,
    startTime: minsAgo(70), endTime: null,
    metadata: { magnitude: 5.2, depth: 34.6, eventId: 'us7000m1qz' }, createdAt: minsAgo(70),
  },
  {
    id: 'ev000001-000b-4eee-a00b-00000000000b', type: 'anomaly', severity: 'low',
    title: 'ADS-B spoofing suspected — ICAO 000000',
    description: 'Positions inconsistent with known flight paths. Possible GPS spoofing or ADS-B injection.',
    latitude: 71.5, longitude: 25.0, radius: 30000,
    startTime: minsAgo(25), endTime: null,
    metadata: { entityId: ID.ghost }, createdAt: minsAgo(25),
  },
  {
    id: 'ev000001-000c-4eee-a00c-00000000000c', type: 'correlation', severity: 'info',
    title: 'Chinese fishing fleet cluster detected',
    description: '12+ AIS tracks clustering in Yellow Sea near disputed EEZ boundary.',
    latitude: 35.0, longitude: 123.5, radius: 25000,
    startTime: minsAgo(90), endTime: null,
    metadata: { vesselCount: 12, region: 'Yellow Sea' }, createdAt: minsAgo(90),
  },
  {
    id: 'ev000001-000d-4eee-a00d-00000000000d', type: 'geofence', severity: 'high',
    title: 'Luxury yacht entered sanctioned port zone',
    description: 'M/Y DILBAR (linked to sanctioned individual) AIS detected entering Maltese port approach.',
    latitude: 35.9, longitude: 14.5, radius: 5000,
    startTime: minsAgo(60), endTime: null,
    metadata: { entityId: ID.yacht, zone: 'MTMLA-approach' }, createdAt: minsAgo(60),
  },
  {
    id: 'ev000001-000e-4eee-a00e-00000000000e', type: 'radio_call', severity: 'info',
    title: 'Coast Guard PAN-PAN relay — Nantucket',
    description: 'USCG Sector SE New England: PAN-PAN for disabled sailing vessel 15 nm south of Nantucket.',
    latitude: 41.1, longitude: -70.0, radius: 28000,
    startTime: minsAgo(10), endTime: null,
    metadata: { source: 'openmhz', talkgroup: 'USCG-SectorSENE' }, createdAt: minsAgo(10),
  },
  {
    id: 'ev000001-000f-4eee-a00f-00000000000f', type: 'anomaly', severity: 'high',
    title: 'BGP route leak — AS4837 announcing Google prefixes',
    description: 'China Unicom briefly announced 1,200 prefixes originated by Google (AS15169). Possible hijack.',
    latitude: null, longitude: null, radius: null,
    startTime: minsAgo(35), endTime: minsAgo(28),
    metadata: { leakingAsn: 4837, affectedAsn: 15169, prefixCount: 1200 }, createdAt: minsAgo(35),
  },
] as const;

// ---------------------------------------------------------------------------
// DEMO_DATA_SOURCES (7)
// ---------------------------------------------------------------------------

export const DEMO_DATA_SOURCES: readonly DemoDataSource[] = [
  {
    id: 'ds000001-0001-4ddd-a001-000000000001', name: 'OpenSky Network', type: 'adsb',
    config: { baseUrl: 'https://opensky-network.org/api', pollIntervalSec: 10 },
    enabled: true, lastSync: minsAgo(1), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(1),
  },
  {
    id: 'ds000001-0002-4ddd-a002-000000000002', name: 'AISHub', type: 'ais',
    config: { baseUrl: 'https://data.aishub.net/ws.php', pollIntervalSec: 30 },
    enabled: true, lastSync: minsAgo(2), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(2),
  },
  {
    id: 'ds000001-0003-4ddd-a003-000000000003', name: 'SatNOGS', type: 'archive',
    config: { baseUrl: 'https://db.satnogs.org/api' },
    enabled: true, lastSync: minsAgo(5), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(5),
  },
  {
    id: 'ds000001-0004-4ddd-a004-000000000004', name: 'SondeHub', type: 'archive',
    config: { baseUrl: 'https://api.v2.sondehub.org' },
    enabled: true, lastSync: minsAgo(3), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(3),
  },
  {
    id: 'ds000001-0005-4ddd-a005-000000000005', name: 'OpenMHz', type: 'rss',
    config: { baseUrl: 'https://api.openmhz.com', systems: ['chi-fire', 'chi-pd'] },
    enabled: true, lastSync: minsAgo(1), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(1),
  },
  {
    id: 'ds000001-0006-4ddd-a006-000000000006', name: 'WSPRnet', type: 'bgp',
    config: { baseUrl: 'http://wsprnet.org/drupal' },
    enabled: true, lastSync: minsAgo(4), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(4),
  },
  {
    id: 'ds000001-0007-4ddd-a007-000000000007', name: 'Priyom', type: 'archive',
    config: { baseUrl: 'https://priyom.org' },
    enabled: true, lastSync: minsAgo(15), status: 'active', errorMessage: null,
    createdAt: minsAgo(10080), updatedAt: minsAgo(15),
  },
] as const;
