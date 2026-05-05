import type { DataSource } from '../../types';

interface SidebarProps {
  sources: DataSource[];
  compact?: boolean;
}

export function Sidebar({ sources, compact = false }: SidebarProps) {
  if (compact) {
    return (
      <div className="sidebar-compact">
        <div className="source-indicators">
          {sources.map((source) => (
            <div
              key={source.id}
              className={`source-dot ${source.status}`}
              title={`${source.name}: ${source.status}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Data Sources</h3>
        <div className="source-list">
          {sources.map((source) => (
            <div key={source.id} className="source-item">
              <span className={`source-status ${source.status}`} />
              <span className="source-name">{source.name}</span>
              <span className="source-type">{source.type}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
