import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/common/StatCard';
import { Loading } from '../components/common/Loading';
import { MapView } from '../components/map/MapView';
import { EntityTypeChart } from '../components/charts/EntityTypeChart';
import { SeverityChart } from '../components/charts/SeverityChart';
import * as api from '../api/client';
import type { Entity, Position, Event, DataSource, Stats } from '../types';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, entitiesData, positionsData, eventsData, sourcesData] =
          await Promise.all([
            api.getStats(),
            api.getEntities({ limit: 100 }),
            api.getLatestPositions(),
            api.getEvents({ limit: 10 }),
            api.getSources(),
          ]);
        setStats(statsData);
        setEntities(entitiesData);
        setPositions(positionsData);
        setEvents(eventsData);
        setSources(sourcesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
        <div className="sources-status">
          {sources.map((s) => (
            <span key={s.id} className={`source-badge ${s.status}`}>
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Entities"
          value={stats.entities.total}
          subtitle={`${Object.keys(stats.entities.byType).length} types tracked`}
          color="blue"
        />
        <StatCard
          title="Positions"
          value={stats.positions.total}
          subtitle="Total position reports"
          color="green"
        />
        <StatCard
          title="Events"
          value={stats.events.total}
          subtitle={`${stats.events.bySeverity.critical ?? 0} critical`}
          color="yellow"
        />
        <StatCard
          title="Data Sources"
          value={stats.sources.total}
          subtitle={`${stats.sources.byStatus?.active ?? 0} active`}
          color="purple"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-map">
          <div className="panel">
            <div className="panel-header">
              <h3>Global View</h3>
              <Link to="/map" className="view-all">
                Full Map
              </Link>
            </div>
            <MapView
              positions={positions}
              entities={entities}
              events={events}
              className="dashboard-map-container"
            />
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className="panel">
            <EntityTypeChart data={stats.entities.byType} />
          </div>

          <div className="panel">
            <SeverityChart data={stats.events.bySeverity} />
          </div>
        </div>
      </div>

      <div className="panel recent-events">
        <div className="panel-header">
          <h3>Recent Events</h3>
          <Link to="/events" className="view-all">
            View All
          </Link>
        </div>
        <div className="event-list">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="event-item">
              <span className={`severity-badge ${event.severity}`}>
                {event.severity}
              </span>
              <div className="event-content">
                <div className="event-title">{event.title}</div>
                <div className="event-description">{event.description}</div>
              </div>
              <div className="event-time">
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
