import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  jsonb,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/** Valid event severity levels */
export const EVENT_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;

/**
 * Events table — stores correlated intelligence events detected by HYDRA.
 *
 * Events may optionally include geographic coordinates and a radius
 * to define the affected area.
 */
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  severity: text('severity', { enum: EVENT_SEVERITIES }).notNull().default('info'),
  title: text('title').notNull(),
  description: text('description'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  radius: doublePrecision('radius'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/** Row returned when selecting from the events table */
export type Event = InferSelectModel<typeof events>;

/** Shape used when inserting into the events table */
export type NewEvent = InferInsertModel<typeof events>;
