/**
 * Canonical entity types tracked by the HYDRA platform.
 * Each corresponds to a category of intelligence target.
 */
export const ENTITY_TYPES = {
  AIRCRAFT: 'aircraft',
  VESSEL: 'vessel',
  NETWORK: 'network',
  SEISMIC: 'seismic',
} as const;

/** Union of all valid entity type values. */
export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

/**
 * Severity levels for events and alerts, ordered from lowest to highest.
 */
export const SEVERITY_LEVELS = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

/** Union of all valid severity level values. */
export type SeverityLevel = (typeof SEVERITY_LEVELS)[keyof typeof SEVERITY_LEVELS];

/**
 * External data sources integrated with HYDRA.
 */
export const DATA_SOURCES = {
  OPENSKY: 'opensky',
  AISHUB: 'aishub',
  USGS: 'usgs',
  RIPE: 'ripe',
} as const;

/** Union of all valid data source values. */
export type DataSource = (typeof DATA_SOURCES)[keyof typeof DATA_SOURCES];
