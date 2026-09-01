import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import { fetchAdminIssueDetail } from '../../services/issues'
import StatusBadge from '../../components/admin/StatusBadge'
import PriorityBadge from '../../components/admin/PriorityBadge'
import AuthenticatedImage from '../../components/admin/AuthenticatedImage'
import IssueLocationMap from '../../components/admin/IssueLocationMap'
import { STATUS_LABELS } from '../../components/admin/chartTheme'

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  )
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
      <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      </div>
    </div>
  )
}

export default function AdminIssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const issueId = Number(id)

  const { data: issue, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'issue-detail', issueId],
    queryFn: () => fetchAdminIssueDetail(issueId),
    enabled: Number.isFinite(issueId),
  })

  return (
    <div className="space-y-6">
      <Link
        to="/admin/issues"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-600"
      >
        <BackArrowIcon />
        Back to issues
      </Link>

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Couldn't load this issue.{' '}
          {isAxiosError(error) && error.response?.status === 403
            ? 'Your account does not have administrator access.'
            : isAxiosError(error) && error.response?.status === 404
              ? "This issue doesn't exist."
              : 'Please try refreshing the page.'}
        </div>
      ) : isLoading || !issue ? (
        <DetailSkeleton />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs text-slate-400">#{issue.id}</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {issue.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} isOverridden={issue.priority_is_overridden} />
            </div>
          </div>

          <DetailCard title="Overview">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoField label="Category" value={issue.category_name} />
              <InfoField label="Reported by" value={`${issue.citizen_name} (${issue.citizen_email})`} />
              <InfoField label="Priority score" value={String(issue.priority_score)} />
              <InfoField label="Address" value={issue.address ?? 'Not provided'} />
              <InfoField label="Created" value={formatDateTime(issue.created_at)} />
              <InfoField label="Last updated" value={formatDateTime(issue.updated_at)} />
            </div>
            {issue.priority_is_overridden && issue.priority_override_reason ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Priority manually overridden. Reason: {issue.priority_override_reason}
              </div>
            ) : null}
          </DetailCard>

          <DetailCard title="Description">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {issue.description}
            </p>
          </DetailCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailCard title="Location">
              <IssueLocationMap latitude={issue.latitude} longitude={issue.longitude} />
            </DetailCard>

            <DetailCard title={`Photos (${issue.images.length})`}>
              {issue.images.length === 0 ? (
                <p className="text-sm text-slate-400">No photos were attached to this report.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {issue.images.map((image) => (
                    <AuthenticatedImage
                      key={image.id}
                      imageId={image.id}
                      alt={image.original_filename}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </DetailCard>
          </div>

          <DetailCard title="Status history">
            {issue.status_history.length === 0 ? (
              <p className="text-sm text-slate-400">No status changes recorded yet.</p>
            ) : (
              <ol className="space-y-4">
                {issue.status_history.map((entry) => (
                  <li key={entry.id} className="flex gap-3 border-l-2 border-teal-100 pl-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {entry.previous_status
                          ? `${STATUS_LABELS[entry.previous_status]} → ${STATUS_LABELS[entry.new_status]}`
                          : STATUS_LABELS[entry.new_status]}
                      </p>
                      {entry.remark ? (
                        <p className="mt-1 text-sm text-slate-600">{entry.remark}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </DetailCard>
        </>
      )}
    </div>
  )
}
