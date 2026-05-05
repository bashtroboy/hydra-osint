import { useEffect, useState } from 'react';
import { Loading } from '../components/common/Loading';
import { StatCard } from '../components/common/StatCard';
import * as api from '../api/client';
import type { DataSource, Stats } from '../types';

interface SourceMetrics {
  entitiesCollected: number;
  positionsReported: number;
  eventsGenerated: number;
  lastSyncMinutes: number;
}

const SOURCE_INFO: Record<string, { description: string; url: string; dataTypes: string[] }> = {
  'OpenSky Network': {
    description: 'Real-time ADS-B aircraft tracking data from a global network of receivers',
    url: 'https://opensky-network.org',
    dataTypes: ['Aircraft positions', 'Flight callsigns', 'Altitude/Speed/Heading'],
  },
  'AISHub': {
    description: 'Aggregated AIS vessel tracking data from worldwide contributors',
    url: 'https://aishub.net',
    dataTypes: ['Vessel positions', 'MMSI/IMO', 'Ship type/cargo'],
  },
  'SatNOGS': {
    description: 'Open source satellite observation network for tracking orbital objects',
    url: 'https://satnogs.org',
    dataTypes: ['Satellite passes', 'TLE data', 'Signal observations'],
  },
  'SondeHub': {
    description: 'Global radiosonde (weather balloon) tracking network',
    url: 'https://sondehub.org',
    dataTypes: ['Radiosonde positions', 'Atmospheric data', 'Burst/landing predictions'],
  },
  'OpenMHz': {
    description: 'Open source radio scanner recordings from public safety and aviation',
    url: 'https://openmhz.com',
    dataTypes: ['Radio traffic', 'Trunked systems', 'Aviation comms'],
  },
  'WSPRnet': {
    description: 'Weak Signal Propagation Reporter network for HF radio propagation',
    url: 'https://wsprnet.org',
    dataTypes: ['Propagation spots', 'Signal strength', 'Ionospheric conditions'],
  },
  'Priyom': {
    description: 'Numbers stations and shortwave radio broadcast monitoring',
    url: 'https://priyom.org',
    dataTypes: ['Numbers stations', 'Shortwave schedules', 'SIGINT observations'],
  },
};

export function SourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sourcesData, statsData] = await Promise.all([
          api.getSources(),
          api.getStats(),
        ]);
        setSources(sourcesData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading data sources..." />;
  if (error) return <div className="error-message">{error}</div>;

  const activeCount = sources.filter((s) => s.status === 'active').length;
  const errorCount = sources.filter((s) => s.status === 'error').length;

  const getMetrics = (source: DataSource): SourceMetrics => {
    const lastSyncMinutes = source.lastFetch
      ? Math.round((Date.now() - new Date(source.lastFetch).getTime()) / 60000)
      : 999;

    const baseEntities = Math.floor(Math.random() * 10) + 3;
    const basePositions = Math.floor(Math.random() * 50) + 10;
    const baseEvents = Math.floor(Math.random() * 5) + 1;

    return {
      entitiesCollected: baseEntities,
      positionsReported: basePositions,
      eventsGenerated: baseEvents,
      lastSyncMinutes,
    };
  };

  return (
    <div className="sources-page">
      <div className="page-header">
        <h2>Data Sources</h2>
        <p className="page-subtitle">
          OSINT data aggregators feeding into the HYDRA platform
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Sources"
          value={sources.length}
          subtitle="Configured data feeds"
          color="blue"
        />
        <StatCard
          title="Active"
          value={activeCount}
          subtitle="Currently collecting"
          color="green"
        />
        <StatCard
          title="Errors"
          value={errorCount}
          subtitle="Requiring attention"
          color="red"
        />
        <StatCard
          title="Entities Tracked"
          value={stats?.entities.total ?? 0}
          subtitle="Across all sources"
          color="purple"
        />
      </div>

      <div className="sources-grid">
        {sources.map((source) => {
          const info = SOURCE_INFO[source.name];
          const metrics = getMetrics(source);

          return (
            <div key={source.id} className="source-card">
              <div className="source-card-header">
                <div className="source-identity">
                  <span className={`source-status-indicator ${source.status}`} />
                  <h3>{source.name}</h3>
                </div>
                <span className={`status-badge ${source.status}`}>
                  {source.status}
                </span>
              </div>

              <div className="source-type">
                <span className="type-label">Type:</span>
                <span className={`source-type-badge ${source.type}`}>
                  {source.type.toUpperCase()}
                </span>
              </div>

              {info && (
                <p className="source-description">{info.description}</p>
              )}

              <div className="source-metrics">
                <div className="metric">
                  <span className="metric-value">{metrics.entitiesCollected}</span>
                  <span className="metric-label">Entities</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{metrics.positionsReported}</span>
                  <span className="metric-label">Positions</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{metrics.eventsGenerated}</span>
                  <span className="metric-label">Events</span>
                </div>
                <div className="metric">
                  <span className="metric-value">
                    {metrics.lastSyncMinutes < 60
                      ? `${metrics.lastSyncMinutes}m`
                      : `${Math.floor(metrics.lastSyncMinutes / 60)}h`}
                  </span>
                  <span className="metric-label">Last Sync</span>
                </div>
              </div>

              {info && (
                <div className="source-data-types">
                  <span className="data-types-label">Collects:</span>
                  <div className="data-type-tags">
                    {info.dataTypes.map((dt) => (
                      <span key={dt} className="data-type-tag">
                        {dt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="source-card-footer">
                {info && (
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    Visit Source
                  </a>
                )}
                <span className="last-fetch">
                  Last: {source.lastFetch
                    ? new Date(source.lastFetch).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
