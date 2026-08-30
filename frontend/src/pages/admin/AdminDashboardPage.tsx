import { useAuth } from '../../hooks/useAuth'

type PlaceholderStat = {
  label: string
  hint: string
}

// Package 2 replaces this static list with a real query against
// GET /api/v1/issues/admin/stats and adds Recharts visualizations below.
const PLACEHOLDER_STATS: PlaceholderStat[] = [
  { label: 'Total issues', hint: 'All-time reports' },
  { label: 'Under review', hint: 'Awaiting triage' },
  { label: 'In progress', hint: 'Being worked on' },
  { label: 'Resolved', hint: 'Closed out' },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.full_name?.trim()?.split(' ')[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here's the current state of civic reports across the city.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDER_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-slate-300">
              —
            </p>
            <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">Charts are on the way</p>
        <p className="mt-1 text-sm text-slate-400">
          Issues by category, status breakdown, monthly trends, and priority distribution will
          appear here once the statistics endpoint is connected.
        </p>
      </div>
    </div>
  )
}
