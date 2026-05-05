import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Position } from '../../types';

interface ActivityChartProps {
  positions: Position[];
}

export function ActivityChart({ positions }: ActivityChartProps) {
  const hourlyData = aggregateByHour(positions);

  return (
    <div className="chart-container">
      <h3 className="chart-title">Position Activity (Last 24h)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={hourlyData}>
          <defs>
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '4px',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            fill="url(#colorActivity)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function aggregateByHour(positions: Position[]): { hour: string; count: number }[] {
  const hourCounts = new Map<number, number>();

  for (let i = 0; i < 24; i++) {
    hourCounts.set(i, 0);
  }

  positions.forEach((p) => {
    const hour = new Date(p.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  });

  return Array.from(hourCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
    }));
}
