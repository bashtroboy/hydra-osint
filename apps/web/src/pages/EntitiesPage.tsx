import { useEffect, useState } from 'react';
import { Loading } from '../components/common/Loading';
import * as api from '../api/client';
import type { Entity, Position, EntityType } from '../types';

const ENTITY_TYPES: EntityType[] = [
  'aircraft',
  'vessel',
  'radiosonde',
  'satellite',
  'network',
  'seismic',
];

export function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [entitiesData, positionsData] = await Promise.all([
          api.getEntities({ limit: 100 }),
          api.getLatestPositions(),
        ]);
        setEntities(entitiesData);
        setPositions(positionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading entities..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredEntities =
    filterType === 'all'
      ? entities
      : entities.filter((e) => e.type === filterType);

  const positionMap = new Map(positions.map((p) => [p.entityId, p]));

  return (
    <div className="entities-page">
      <div className="page-header">
        <h2>Entities</h2>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({entities.length})
          </button>
          {ENTITY_TYPES.map((type) => {
            const count = entities.filter((e) => e.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                className={`filter-tab ${type} ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="entities-layout">
        <div className="entities-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Identifier</th>
                <th>Name</th>
                <th>Position</th>
                <th>First Seen</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map((entity) => {
                const position = positionMap.get(entity.id);
                return (
                  <tr
                    key={entity.id}
                    className={selectedEntity?.id === entity.id ? 'selected' : ''}
                    onClick={() => setSelectedEntity(entity)}
                  >
                    <td>
                      <span className={`type-badge ${entity.type}`}>
                        {entity.type}
                      </span>
                    </td>
                    <td className="mono">{entity.identifier}</td>
                    <td>{entity.name ?? '-'}</td>
                    <td className="mono">
                      {position
                        ? `${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}`
                        : '-'}
                    </td>
                    <td>{new Date(entity.firstSeen).toLocaleDateString()}</td>
                    <td>{new Date(entity.lastSeen).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedEntity && (
          <div className="entity-detail-panel">
            <div className="panel-header">
              <span className={`type-badge ${selectedEntity.type}`}>
                {selectedEntity.type}
              </span>
              <h3>{selectedEntity.identifier}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedEntity(null)}
              >
                x
              </button>
            </div>

            <div className="detail-section">
              <h4>Details</h4>
              {selectedEntity.name && (
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span>{selectedEntity.name}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">First Seen:</span>
                <span>{new Date(selectedEntity.firstSeen).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Last Seen:</span>
                <span>{new Date(selectedEntity.lastSeen).toLocaleString()}</span>
              </div>
            </div>

            {positionMap.get(selectedEntity.id) && (
              <div className="detail-section">
                <h4>Last Position</h4>
                {(() => {
                  const pos = positionMap.get(selectedEntity.id)!;
                  return (
                    <>
                      <div className="detail-row">
                        <span className="label">Coordinates:</span>
                        <span className="mono">
                          {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                        </span>
                      </div>
                      {pos.altitude != null && (
                        <div className="detail-row">
                          <span className="label">Altitude:</span>
                          <span>{pos.altitude.toLocaleString()} ft</span>
                        </div>
                      )}
                      {pos.speed != null && (
                        <div className="detail-row">
                          <span className="label">Speed:</span>
                          <span>{pos.speed} kts</span>
                        </div>
                      )}
                      {pos.heading != null && (
                        <div className="detail-row">
                          <span className="label">Heading:</span>
                          <span>{pos.heading}°</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">Source:</span>
                        <span>{pos.source}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {Object.keys(selectedEntity.metadata).length > 0 && (
              <div className="detail-section">
                <h4>Metadata</h4>
                <pre className="metadata-json">
                  {JSON.stringify(selectedEntity.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
