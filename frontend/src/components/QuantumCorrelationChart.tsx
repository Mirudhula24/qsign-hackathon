import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CorrelationPoint } from '../types';

interface QuantumCorrelationChartProps {
  curve: CorrelationPoint[];
}

export default function QuantumCorrelationChart({ curve }: QuantumCorrelationChartProps) {
  if (!curve || curve.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={curve} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="delta_deg"
          tickFormatter={(d) => `${d}°`}
          tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'var(--border)' }} tickLine={false}
        />
        <YAxis
          domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]}
          tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'var(--border)' }} tickLine={false}
        />
        <Tooltip
          formatter={(value) => (typeof value === 'number' ? value.toFixed(3) : value)}
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        <Line name="Measured (quantum)" type="monotone" dataKey="measured" stroke="var(--navy)" strokeWidth={2.2} dot={{ r: 2.5 }} isAnimationActive={false} />
        <Line name="Quantum prediction" type="monotone" dataKey="quantum_theory" stroke="var(--brown)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line name="Classical limit" type="monotone" dataKey="classical" stroke="var(--error)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
