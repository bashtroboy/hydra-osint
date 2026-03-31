/**
 * In-memory database for demo mode.
 * Stores entities, positions, events, and data sources in arrays
 * and provides query-like methods matching what the routes expect.
 */

/** Entity record shape matching the Drizzle schema. */
export interface DemoEntity {
  readonly id: string;
  readonly type: string;
  readonly identifier: string;
  readonly name: string | null;
  readonly metadata: unknown;
  readonly firstSeen: Date;
  readonly lastSeen: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Position record shape matching the Drizzle schema. */
export interface DemoPosition {
  readonly id: string;
  readonly entityId: string;
  readonly timestamp: Date;
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly speed: number | null;
  readonly heading: number | null;
  readonly source: string;
  readonly raw: unknown;
}

/** Event record shape matching the Drizzle schema. */
export interface DemoEvent {
  readonly id: string;
  readonly type: string;
  readonly severity: string;
  readonly title: string;
  readonly description: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly radius: number | null;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly metadata: unknown;
  readonly createdAt: Date | null;
}

/** Data source record shape matching the Drizzle schema. */
export interface DemoDataSource {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly config: unknown;
  readonly enabled: boolean;
  readonly lastSync: Date | null;
  readonly status: string;
  readonly errorMessage: string | null;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
}

/** Pagination options for list queries. */
interface PaginationOpts {
  readonly page?: number;
  readonly limit?: number;
}

/** Filter options for entity queries. */
interface EntityQueryOpts extends PaginationOpts {
  readonly type?: string;
}

/** Filter options for position queries. */
interface PositionQueryOpts {
  readonly entityId?: string;
  readonly minLat?: number;
  readonly maxLat?: number;
  readonly minLon?: number;
  readonly maxLon?: number;
  readonly start?: Date;
  readonly end?: Date;
  readonly limit?: number;
}

/** Filter options for event queries. */
interface EventQueryOpts extends PaginationOpts {
  readonly type?: string;
  readonly severity?: string;
}

/** Paginated result wrapper. */
interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

/** Summary statistics returned by getStats. */
interface DemoStats {
  readonly entities: {
    readonly total: number;
    readonly byType: Record<string, number>;
  };
  readonly positions: {
    readonly total: number;
  };
  readonly events: {
    readonly total: number;
    readonly bySeverity: Record<string, number>;
  };
  readonly sources: {
    readonly total: number;
    readonly byStatus: Record<string, number>;
  };
}

/** Options passed to the DemoDatabase constructor. */
export interface DemoDatabaseOptions {
  readonly entities: readonly DemoEntity[];
  readonly positions: readonly DemoPosition[];
  readonly events: readonly DemoEvent[];
  readonly dataSources: readonly DemoDataSource[];
}

/**
 * In-memory store that mimics the database layer used by HYDRA API routes.
 *
 * All query methods use simple array operations (filter, slice, sort) rather
 * than real SQL, which keeps demo mode startup instant.
 */
export class DemoDatabase {
  private readonly entities: readonly DemoEntity[];
  private readonly positions: readonly DemoPosition[];
  private readonly events: readonly DemoEvent[];
  private readonly dataSources: readonly DemoDataSource[];

  constructor(opts: DemoDatabaseOptions) {
    this.entities = opts.entities;
    this.positions = opts.positions;
    this.events = opts.events;
    this.dataSources = opts.dataSources;
  }

  /**
   * Returns a paginated list of entities with optional type filter.
   *
   * @param opts - Pagination and filter options
   * @returns Paginated entity result
   */
  getEntities(opts: EntityQueryOpts = {}): PaginatedResult<DemoEntity> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));

    let filtered = this.entities;
    if (opts.type) {
      filtered = filtered.filter((e) => e.type === opts.type);
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Looks up a single entity by its UUID.
   *
   * @param id - Entity UUID
   * @returns The entity or undefined if not found
   */
  getEntityById(id: string): DemoEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  /**
   * Returns positions filtered by entity, bounding box, time range, and limit.
   *
   * @param opts - Filter options
   * @returns Matching position records sorted by timestamp descending
   */
  getPositions(opts: PositionQueryOpts = {}): readonly DemoPosition[] {
    const limit = Math.min(1000, Math.max(1, opts.limit ?? 100));

    let filtered = [...this.positions];

    if (opts.entityId) {
      filtered = filtered.filter((p) => p.entityId === opts.entityId);
    }
    if (opts.minLat !== undefined) {
      filtered = filtered.filter((p) => p.latitude >= opts.minLat!);
    }
    if (opts.maxLat !== undefined) {
      filtered = filtered.filter((p) => p.latitude <= opts.maxLat!);
    }
    if (opts.minLon !== undefined) {
      filtered = filtered.filter((p) => p.longitude >= opts.minLon!);
    }
    if (opts.maxLon !== undefined) {
      filtered = filtered.filter((p) => p.longitude <= opts.maxLon!);
    }
    if (opts.start) {
      const startTime = opts.start.getTime();
      filtered = filtered.filter((p) => p.timestamp.getTime() >= startTime);
    }
    if (opts.end) {
      const endTime = opts.end.getTime();
      filtered = filtered.filter((p) => p.timestamp.getTime() <= endTime);
    }

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filtered.slice(0, limit);
  }

  /**
   * Returns the latest position for each entity (most recent timestamp per entityId).
   *
   * @returns One position per entity, sorted by timestamp descending
   */
  getLatestPositions(): readonly DemoPosition[] {
    const latestMap = new Map<string, DemoPosition>();

    for (const pos of this.positions) {
      const existing = latestMap.get(pos.entityId);
      if (!existing || pos.timestamp.getTime() > existing.timestamp.getTime()) {
        latestMap.set(pos.entityId, pos);
      }
    }

    return [...latestMap.values()].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Returns a paginated list of events with optional type and severity filters.
   *
   * @param opts - Pagination and filter options
   * @returns Paginated event result
   */
  getEvents(opts: EventQueryOpts = {}): PaginatedResult<DemoEvent> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));

    let filtered = this.events;
    if (opts.type) {
      filtered = filtered.filter((e) => e.type === opts.type);
    }
    if (opts.severity) {
      filtered = filtered.filter((e) => e.severity === opts.severity);
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Returns all configured data sources.
   *
   * @returns All data source records
   */
  getSources(): readonly DemoDataSource[] {
    return this.dataSources;
  }

  /**
   * Looks up a single data source by its UUID.
   *
   * @param id - Data source UUID
   * @returns The data source or undefined if not found
   */
  getSourceById(id: string): DemoDataSource | undefined {
    return this.dataSources.find((s) => s.id === id);
  }

  /**
   * Returns summary statistics for the dashboard.
   *
   * @returns Aggregated counts by entity type, event severity, and source status
   */
  getStats(): DemoStats {
    const entityByType: Record<string, number> = {};
    for (const entity of this.entities) {
      entityByType[entity.type] = (entityByType[entity.type] ?? 0) + 1;
    }

    const eventBySeverity: Record<string, number> = {};
    for (const event of this.events) {
      eventBySeverity[event.severity] = (eventBySeverity[event.severity] ?? 0) + 1;
    }

    const sourceByStatus: Record<string, number> = {};
    for (const source of this.dataSources) {
      sourceByStatus[source.status] = (sourceByStatus[source.status] ?? 0) + 1;
    }

    return {
      entities: {
        total: this.entities.length,
        byType: entityByType,
      },
      positions: {
        total: this.positions.length,
      },
      events: {
        total: this.events.length,
        bySeverity: eventBySeverity,
      },
      sources: {
        total: this.dataSources.length,
        byStatus: sourceByStatus,
      },
    };
  }
}
