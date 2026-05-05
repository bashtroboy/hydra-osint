import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Event } from '../../types';

interface EventTimelineChartProps {
  events: Event[];
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export function EventTimelineChart({ events }: EventTimelineChartProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const chartData = sortedEvents.map((event) => ({
    id: event.id,
    title: event.title.slice(0, 30) + (event.title.length > 30 ? '...' : ''),
    fullTitle: event.title,
    severity: event.severity,
    time: new Date(event.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    value: 1,
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">Event Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="title"
            stroke="#94a3b8"
            width={200}
            fontSize={11}
            tick={{ fill: '#94a3b8' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="chart-tooltip">
                  <div className={`severity-badge ${data.severity}`}>
                    {data.severity}
                  </div>
                  <div className="tooltip-title">{data.fullTitle}</div>
                  <div className="tooltip-time">{data.time}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill={SEVERITY_COLORS[entry.severity] ?? '#64748b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
