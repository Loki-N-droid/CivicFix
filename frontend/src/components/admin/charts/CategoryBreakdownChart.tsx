import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CategoryCount } from '../../../types/issue'
import { ACCENT_COLOR } from '../chartTheme'

export default function CategoryBreakdownChart({ data }: { data: CategoryCount[] }) {
  // Horizontal bars read better than vertical ones once category names get
  // long (e.g. "Streetlight / Electrical"), and they sort naturally by count.
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .map((row) => ({ name: row.category_name, value: row.count }))

  if (chartData.every((row) => row.value === 0)) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
        No issues yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12, fill: '#334155' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(value) => [value, 'Issues']} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="value" fill={ACCENT_COLOR} radius={[0, 6, 6, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
