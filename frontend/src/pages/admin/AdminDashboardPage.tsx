import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuth } from '../../hooks/useAuth'
import { fetchDashboardStats } from '../../services/issues'
import StatCard from '../../components/admin/StatCard'
import StatusDistributionChart from '../../components/admin/charts/StatusDistributionChart'
import PriorityDistributionChart from '../../components/admin/charts/PriorityDistributionChart'
import CategoryBreakdownChart from '../../components/admin/charts/CategoryBreakdownChart'
import MonthlyTrendChart from '../../components/admin/charts/MonthlyTrendChart'

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      ))}
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[320px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.full_name?.trim()?.split(' ')[0]

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  const statusCount = (status: string) =>
    data?.status_counts.find((row) => row.status === status)?.count ?? 0

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

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Couldn't load dashboard statistics.{' '}
          {isAxiosError(error) && error.response?.status === 403
            ? 'Your account does not have administrator access.'
            : 'Please try refreshing the page.'}
        </div>
      ) : null}

      {isLoading ? (
        <StatCardsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total issues" value={data.total_issues} hint="All-time reports" />
          <StatCard
            label="Under review"
            value={statusCount('under_review')}
            hint="Awaiting triage"
            accentClassName="text-amber-600"
          />
          <StatCard
            label="In progress"
            value={statusCount('in_progress')}
            hint="Being worked on"
            accentClassName="text-blue-600"
          />
          <StatCard
            label="Resolved"
            value={statusCount('resolved')}
            hint="Closed out"
            accentClassName="text-emerald-600"
          />
        </div>
      ) : null}

      {isLoading ? (
        <ChartsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DashboardCard title="Issues by status">
            <StatusDistributionChart data={data.status_counts} />
          </DashboardCard>
          <DashboardCard title="Priority distribution">
            <PriorityDistributionChart data={data.priority_counts} />
          </DashboardCard>
          <DashboardCard title="Issues by category">
            <CategoryBreakdownChart data={data.category_counts} />
          </DashboardCard>
          <DashboardCard title="Monthly trend (last 6 months)">
            <MonthlyTrendChart data={data.monthly_trend} />
          </DashboardCard>
        </div>
      ) : null}
    </div>
  )
}
