import { useEffect, useState } from 'react';
import { MapView } from '../components/map/MapView';
import { Loading } from '../components/common/Loading';
import * as api from '../api/client';
import type { Entity, Position, Event, EntityType } from '../types';

const ENTITY_TYPES: EntityType[] = [
  'aircraft',
  'vessel',
  'radiosonde',
  'satellite',
  'network',
  'seismic',
];

export function MapPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<EntityType>>(
    new Set(ENTITY_TYPES)
  );
  const [showEvents, setShowEvents] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [entitiesData, positionsData, eventsData] = await Promise.all([
          api.getEntities({ limit: 100 }),
          api.getLatestPositions(),
          api.getEvents({ limit: 50 }),
        ]);
        setEntities(entitiesData);
        setPositions(positionsData);
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading map data..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredEntities = entities.filter((e) => visibleTypes.has(e.type));
  const filteredPositions = positions.filter((p) => {
    const entity = entities.find((e) => e.id === p.entityId);
    return entity && visibleTypes.has(entity.type);
  });

  const selectedEntity = selectedEntityId
    ? entities.find((e) => e.id === selectedEntityId)
    : null;

  const toggleType = (type: EntityType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className="map-page">
      <div className="map-controls">
        <div className="control-group">
          <span className="control-label">Layers:</span>
          {ENTITY_TYPES.map((type) => (
            <button
              key={type}
              className={`layer-toggle ${visibleTypes.has(type) ? 'active' : ''} ${type}`}
              onClick={() => toggleType(type)}
            >
              {type}
            </button>
          ))}
          <button
            className={`layer-toggle events ${showEvents ? 'active' : ''}`}
            onClick={() => setShowEvents(!showEvents)}
          >
            events
          </button>
        </div>

        {selectedEntity && (
          <div className="selected-entity">
            <span className={`type-badge ${selectedEntity.type}`}>
              {selectedEntity.type}
            </span>
            <strong>{selectedEntity.identifier}</strong>
            {selectedEntity.name && <span> - {selectedEntity.name}</span>}
            <button
              className="clear-selection"
              onClick={() => setSelectedEntityId(null)}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <MapView
        positions={filteredPositions}
        entities={filteredEntities}
        events={showEvents ? events : []}
        selectedEntityId={selectedEntityId}
        onSelectEntity={setSelectedEntityId}
        showEvents={showEvents}
        showTracks={true}
        className="fullscreen-map"
      />

      <div className="map-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-items">
          {ENTITY_TYPES.filter((t) => visibleTypes.has(t)).map((type) => (
            <div key={type} className="legend-item">
              <span className={`legend-icon ${type}`} />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
