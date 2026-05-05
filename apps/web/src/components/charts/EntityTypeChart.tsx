import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface EntityTypeChartProps {
  data: Record<string, number>;
}

const COLORS: Record<string, string> = {
  aircraft: '#3b82f6',
  vessel: '#06b6d4',
  radiosonde: '#22c55e',
  satellite: '#a855f7',
  network: '#f59e0b',
  seismic: '#ef4444',
};

export function EntityTypeChart({ data }: EntityTypeChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">Entities by Type</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] ?? '#64748b'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '4px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
