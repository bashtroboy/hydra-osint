import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Entity, Position, EntityType } from '../../types';

interface EntityMarkersProps {
  positions: Position[];
  entityMap: Map<string, Entity>;
  selectedEntityId?: string | null;
  onSelectEntity?: (id: string | null) => void;
}

const ENTITY_ICONS: Record<EntityType, string> = {
  aircraft: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  vessel: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
  radiosonde: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  satellite: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m17.71 7.71-1.42-1.42 1.42-1.41a2 2 0 0 0-2.83-2.83l-1.41 1.42-1.42-1.42-1.41 1.42 7.07 7.07 1.41-1.42-1.41-1.41zM12 14.5l-2.5 2.5-2.5-2.5 2.5-2.5 2.5 2.5zM8.46 9.88 2.1 16.24c-1.17 1.17-1.17 3.07 0 4.24l1.42 1.42c1.17 1.17 3.07 1.17 4.24 0l6.36-6.36-5.66-5.66z"/></svg>`,
  network: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-4z"/></svg>`,
  seismic: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  aircraft: '#3b82f6',
  vessel: '#06b6d4',
  radiosonde: '#22c55e',
  satellite: '#a855f7',
  network: '#f59e0b',
  seismic: '#ef4444',
};

function createEntityIcon(type: EntityType, selected: boolean): L.DivIcon {
  const color = ENTITY_COLORS[type];
  const svg = ENTITY_ICONS[type];
  const size = selected ? 32 : 24;

  return L.divIcon({
    className: 'entity-marker',
    html: `<div class="entity-marker-inner ${selected ? 'selected' : ''}" style="color: ${color}; width: ${size}px; height: ${size}px;">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function EntityMarkers({
  positions,
  entityMap,
  selectedEntityId,
  onSelectEntity,
}: EntityMarkersProps) {
  return (
    <>
      {positions.map((position, index) => {
        const entity = entityMap.get(position.entityId);
        if (!entity) return null;

        const isSelected = entity.id === selectedEntityId;
        const icon = createEntityIcon(entity.type, isSelected);

        return (
          <Marker
            key={`${position.id}-${index}`}
            position={[position.latitude, position.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectEntity?.(isSelected ? null : entity.id),
            }}
          >
            <Popup>
              <div className="entity-popup">
                <div className="popup-header">
                  <span className={`type-badge ${entity.type}`}>{entity.type}</span>
                  <strong>{entity.identifier}</strong>
                </div>
                {entity.name && <div className="popup-name">{entity.name}</div>}
                <div className="popup-details">
                  <div>
                    <span className="label">Position:</span>
                    <span>
                      {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
                    </span>
                  </div>
                  {position.altitude != null && (
                    <div>
                      <span className="label">Altitude:</span>
                      <span>{position.altitude.toLocaleString()} ft</span>
                    </div>
                  )}
                  {position.speed != null && (
                    <div>
                      <span className="label">Speed:</span>
                      <span>{position.speed} kts</span>
                    </div>
                  )}
                  {position.heading != null && (
                    <div>
                      <span className="label">Heading:</span>
                      <span>{position.heading}°</span>
                    </div>
                  )}
                  <div>
                    <span className="label">Source:</span>
                    <span>{position.source}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
