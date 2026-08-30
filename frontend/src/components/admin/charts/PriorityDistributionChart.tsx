import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PriorityCount } from '../../../types/issue'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../chartTheme'

export default function PriorityDistributionChart({ data }: { data: PriorityCount[] }) {
  const chartData = data.map((row) => ({
    name: PRIORITY_LABELS[row.priority],
    value: row.count,
    key: row.priority,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(value) => [value, 'Issues']} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
