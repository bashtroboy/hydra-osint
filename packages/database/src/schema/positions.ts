import {
  pgTable,
  uuid,
  timestamp,
  doublePrecision,
  text,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { entities } from './entities.js';

/**
 * Positions table — stores time-series location data for tracked entities.
 *
 * Each row represents a single observed position from a given data source.
 */
export const positions = pgTable(
  'positions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityId: uuid('entity_id')
      .references(() => entities.id)
      .notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    altitude: doublePrecision('altitude'),
    speed: doublePrecision('speed'),
    heading: doublePrecision('heading'),
    source: text('source').notNull(),
    raw: jsonb('raw'),
  },
  (table) => [
    index('positions_entity_id_idx').on(table.entityId),
    index('positions_timestamp_idx').on(table.timestamp),
  ],
);

/** Row returned when selecting from the positions table */
export type Position = InferSelectModel<typeof positions>;

/** Shape used when inserting into the positions table */
export type NewPosition = InferInsertModel<typeof positions>;
