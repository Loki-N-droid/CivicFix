import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { StatusCount } from '../../../types/issue'
import { STATUS_COLORS, STATUS_LABELS } from '../chartTheme'

export default function StatusDistributionChart({ data }: { data: StatusCount[] }) {
  const chartData = data
    .filter((row) => row.count > 0)
    .map((row) => ({ name: STATUS_LABELS[row.status], value: row.count, key: row.status }))

  if (chartData.length === 0) {
    return <EmptyState />
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, 'Issues']} />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}

function EmptyState() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
      No issues yet.
    </div>
  )
}
