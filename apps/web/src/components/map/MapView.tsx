import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Entity, Position, Event } from '../../types';
import { EntityMarkers } from './EntityMarkers';
import { EventCircles } from './EventCircles';
import { TrackLines } from './TrackLines';

interface MapViewProps {
  positions: Position[];
  entities: Entity[];
  events?: Event[];
  selectedEntityId?: string | null;
  onSelectEntity?: (id: string | null) => void;
  className?: string;
  showEvents?: boolean;
  showTracks?: boolean;
  center?: LatLngExpression;
  zoom?: number;
}

const DEFAULT_CENTER: LatLngExpression = [30, 0];
const DEFAULT_ZOOM = 2;

const DARK_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function MapView({
  positions,
  entities,
  events = [],
  selectedEntityId,
  onSelectEntity,
  className = '',
  showEvents = true,
  showTracks = true,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`map-container ${className}`}
      scrollWheelZoom={true}
    >
      <TileLayer url={DARK_TILE_URL} attribution={DARK_TILE_ATTRIBUTION} />

      {showTracks && selectedEntityId && (
        <TrackLines
          positions={positions.filter((p) => p.entityId === selectedEntityId)}
        />
      )}

      {showEvents && <EventCircles events={events} />}

      <EntityMarkers
        positions={positions}
        entityMap={entityMap}
        selectedEntityId={selectedEntityId}
        onSelectEntity={onSelectEntity}
      />

      {selectedEntityId && (
        <FlyToEntity
          positions={positions}
          entityId={selectedEntityId}
        />
      )}
    </MapContainer>
  );
}

function FlyToEntity({
  positions,
  entityId,
}: {
  positions: Position[];
  entityId: string;
}) {
  const map = useMap();
  const position = positions.find((p) => p.entityId === entityId);

  if (position) {
    map.flyTo([position.latitude, position.longitude], 6, { duration: 1 });
  }

  return null;
}
