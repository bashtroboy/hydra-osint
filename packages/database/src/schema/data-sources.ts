import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/** Valid data source types */
export const DATA_SOURCE_TYPES = ['adsb', 'ais', 'rss', 'bgp', 'seismic', 'archive'] as const;

/** Valid data source statuses */
export const DATA_SOURCE_STATUSES = ['active', 'error', 'disabled'] as const;

/**
 * Data sources table — tracks configured collection sources and their status.
 */
export const dataSources = pgTable('data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: DATA_SOURCE_TYPES }).notNull(),
  config: jsonb('config'),
  enabled: boolean('enabled').notNull().default(true),
  lastSync: timestamp('last_sync', { withTimezone: true }),
  status: text('status', { enum: DATA_SOURCE_STATUSES }).notNull().default('active'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/** Row returned when selecting from the data_sources table */
export type DataSource = InferSelectModel<typeof dataSources>;

/** Shape used when inserting into the data_sources table */
export type NewDataSource = InferInsertModel<typeof dataSources>;
