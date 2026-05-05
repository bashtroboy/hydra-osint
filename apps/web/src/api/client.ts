import type {
  Entity,
  Position,
  Event,
  DataSource,
  Stats,
  PaginatedResponse,
} from '../types';

const API_BASE = '/api/v1';

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return json.data ?? json;
}

export async function getStats(): Promise<Stats> {
  return fetchApi<Stats>('/stats');
}

export async function getEntities(params?: {
  type?: string;
  limit?: number;
}): Promise<Entity[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  const response = await fetchApi<Entity[] | PaginatedResponse<Entity>>(
    `/entities${query ? `?${query}` : ''}`
  );
  return Array.isArray(response) ? response : response.data;
}

export async function getEntity(id: string): Promise<Entity> {
  return fetchApi<Entity>(`/entities/${id}`);
}

export async function getPositions(params?: {
  entityId?: string;
  limit?: number;
}): Promise<Position[]> {
  const searchParams = new URLSearchParams();
  if (params?.entityId) searchParams.set('entityId', params.entityId);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  const response = await fetchApi<Position[] | PaginatedResponse<Position>>(
    `/positions${query ? `?${query}` : ''}`
  );
  return Array.isArray(response) ? response : response.data;
}

export async function getLatestPositions(): Promise<Position[]> {
  const response = await fetchApi<Position[] | PaginatedResponse<Position>>(
    '/positions/latest'
  );
  return Array.isArray(response) ? response : response.data;
}

export async function getEvents(params?: {
  severity?: string;
  limit?: number;
}): Promise<Event[]> {
  const searchParams = new URLSearchParams();
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  const response = await fetchApi<Event[] | PaginatedResponse<Event>>(
    `/events${query ? `?${query}` : ''}`
  );
  return Array.isArray(response) ? response : response.data;
}

export async function getSources(): Promise<DataSource[]> {
  const response = await fetchApi<DataSource[] | PaginatedResponse<DataSource>>(
    '/sources'
  );
  return Array.isArray(response) ? response : response.data;
}
