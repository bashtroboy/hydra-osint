export { createDatabase, getDatabaseUrl } from './client';
export type { DatabaseClient } from './client';

export {
  entities,
  ENTITY_TYPES,
  positions,
  events,
  EVENT_SEVERITIES,
  dataSources,
  DATA_SOURCE_TYPES,
  DATA_SOURCE_STATUSES,
  users,
} from './schema/index';

export type {
  Entity,
  NewEntity,
  Position,
  NewPosition,
  Event,
  NewEvent,
  DataSource,
  NewDataSource,
  User,
  NewUser,
} from './types';
