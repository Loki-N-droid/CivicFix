import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthlyCount } from '../../../types/issue'
import { ACCENT_COLOR } from '../chartTheme'

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' })

function formatMonth(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return MONTH_FORMATTER.format(new Date(year, month - 1, 1))
}

export default function MonthlyTrendChart({ data }: { data: MonthlyCount[] }) {
  const chartData = data.map((row) => ({ name: formatMonth(row.month), value: row.count }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(value) => [value, 'Issues reported']} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={ACCENT_COLOR}
          strokeWidth={2.5}
          dot={{ r: 4, fill: ACCENT_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
