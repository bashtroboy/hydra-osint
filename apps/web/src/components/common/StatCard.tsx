interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'cyan';
}

export function StatCard({ title, value, subtitle, color = 'blue' }: StatCardProps) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="stat-title">{title}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}
