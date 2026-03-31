import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/** Valid entity types tracked by HYDRA */
export const ENTITY_TYPES = ['aircraft', 'vessel', 'network', 'seismic'] as const;

/**
 * Entities table — stores tracked objects across all data sources.
 *
 * Each entity is uniquely identified by its (type, identifier) pair.
 */
export const entities = pgTable(
  'entities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type', { enum: ENTITY_TYPES }).notNull(),
    identifier: text('identifier').notNull(),
    name: text('name'),
    metadata: jsonb('metadata'),
    firstSeen: timestamp('first_seen', { withTimezone: true }).notNull().defaultNow(),
    lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('entities_type_identifier_idx').on(table.type, table.identifier),
  ],
);

/** Row returned when selecting from the entities table */
export type Entity = InferSelectModel<typeof entities>;

/** Shape used when inserting into the entities table */
export type NewEntity = InferInsertModel<typeof entities>;
