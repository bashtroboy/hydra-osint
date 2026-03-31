export {
  HydraError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ExternalServiceError,
} from './errors/index.js';

export { type Result, Ok, Err, isOk, isErr } from './result/index.js';

export {
  createLogger,
  type CreateLoggerOptions,
  DEFAULT_REDACT_PATHS,
  DEFAULT_LOG_LEVEL,
  getDefaultLoggerConfig,
} from './logger/index.js';

export {
  haversineDistance,
  calculateBearing,
  expandBbox,
  pointInBbox,
  type BBox,
} from './geo/index.js';

export {
  toUnixTimestamp,
  fromUnixTimestamp,
  isWithinTimeWindow,
  getTimeWindowBounds,
  type TimeWindowBounds,
} from './time/index.js';

export {
  ENTITY_TYPES,
  type EntityType,
  SEVERITY_LEVELS,
  type SeverityLevel,
  DATA_SOURCES,
  type DataSource,
} from './constants/index.js';

export {
  chunk,
  sleep,
  retry,
  type RetryOptions,
} from './utils/index.js';
