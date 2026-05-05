import { useEffect, useState } from 'react';
import { Loading } from '../components/common/Loading';
import { EntityTypeChart } from '../components/charts/EntityTypeChart';
import { SeverityChart } from '../components/charts/SeverityChart';
import { ActivityChart } from '../components/charts/ActivityChart';
import * as api from '../api/client';
import type { Position, Stats, DataSource } from '../types';

export function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, positionsData, sourcesData] = await Promise.all([
          api.getStats(),
          api.getPositions({ limit: 500 }),
          api.getSources(),
        ]);
        setStats(statsData);
        setPositions(positionsData);
        setSources(sourcesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading analytics..." />;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;

  const activeSourceCount = sources.filter((s) => s.status === 'active').length;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h2>Analytics</h2>
      </div>

      <div className="analytics-summary">
        <div className="summary-item">
          <span className="summary-value">{stats.entities.total}</span>
          <span className="summary-label">Total Entities</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{stats.positions.total}</span>
          <span className="summary-label">Position Reports</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{stats.events.total}</span>
          <span className="summary-label">Events</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">
            {activeSourceCount}/{sources.length}
          </span>
          <span className="summary-label">Active Sources</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <EntityTypeChart data={stats.entities.byType} />
        </div>

        <div className="panel">
          <SeverityChart data={stats.events.bySeverity} />
        </div>

        <div className="panel span-2">
          <ActivityChart positions={positions} />
        </div>
      </div>

      <div className="panel">
        <h3 className="chart-title">Data Coverage by Type</h3>
        <div className="coverage-grid">
          {Object.entries(stats.entities.byType).map(([type, count]) => {
            const percentage = Math.round((count / stats.entities.total) * 100);
            return (
              <div key={type} className="coverage-item">
                <div className="coverage-header">
                  <span className={`type-badge ${type}`}>{type}</span>
                  <span className="coverage-count">{count}</span>
                </div>
                <div className="coverage-bar">
                  <div
                    className={`coverage-fill ${type}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="coverage-percent">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
