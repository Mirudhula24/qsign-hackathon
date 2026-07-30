import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CorrelationChartProps {
  data: Array<{ angle: number; value: number }>;
}

export default function CorrelationChart({ data }: CorrelationChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="correlation-chart-container">
      <p className="correlation-chart__label">CORRELATION CURVE</p>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="angle" tickFormatter={(angle) => `${angle}°`} tick={{ fill: 'var(--ink-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{ fill: 'var(--ink-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <Tooltip 
            formatter={(value) => (typeof value === 'number' ? value.toFixed(3) : value)}
            contentStyle={{ backgroundColor: 'var(--card-bg)', border: `1px solid var(--border)` }}
          />
          <ReferenceLine y={0.5} stroke="var(--danger)" strokeDasharray="5 5" label={{ value: 'threshold', position: 'insideTopRight', fill: 'var(--danger)', fontSize: 10 }} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="var(--accent)" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
