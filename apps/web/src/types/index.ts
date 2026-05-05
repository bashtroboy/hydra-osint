export interface Entity {
  id: string;
  type: EntityType;
  identifier: string;
  name: string | null;
  metadata: Record<string, unknown>;
  firstSeen: string;
  lastSeen: string;
}

export type EntityType =
  | 'aircraft'
  | 'vessel'
  | 'radiosonde'
  | 'satellite'
  | 'network'
  | 'seismic';

export interface Position {
  id: string;
  entityId: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
  source: string;
}

export interface Event {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  description: string;
  entityIds: string[];
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  timestamp: string;
}

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastFetch: string | null;
}

export interface Stats {
  entities: {
    total: number;
    byType: Record<string, number>;
  };
  positions: {
    total: number;
  };
  events: {
    total: number;
    bySeverity: Record<string, number>;
  };
  sources: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
