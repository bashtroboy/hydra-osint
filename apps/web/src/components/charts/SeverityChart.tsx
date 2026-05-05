import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SeverityChartProps {
  data: Record<string, number>;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const SEVERITY_ORDER = ['info', 'low', 'medium', 'high', 'critical'];

export function SeverityChart({ data }: SeverityChartProps) {
  const chartData = SEVERITY_ORDER.filter((s) => data[s] !== undefined).map(
    (severity) => ({
      severity,
      count: data[severity] ?? 0,
    })
  );

  return (
    <div className="chart-container">
      <h3 className="chart-title">Events by Severity</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis
            type="category"
            dataKey="severity"
            stroke="#94a3b8"
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '4px',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.severity}
                fill={SEVERITY_COLORS[entry.severity] ?? '#64748b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
