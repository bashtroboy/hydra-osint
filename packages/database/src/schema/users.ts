import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Users table — stores platform user accounts and authentication state.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('viewer'),
  active: boolean('active').notNull().default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Row returned when selecting from the users table */
export type User = InferSelectModel<typeof users>;

/** Shape used when inserting into the users table */
export type NewUser = InferInsertModel<typeof users>;
