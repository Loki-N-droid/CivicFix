import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { fetchIssueDetail } from '../services/issues'

const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function IssueDetailPage() {
  const { id } = useParams()
  const issueId = Number(id)
  const { data: issue, isLoading, isError } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => fetchIssueDetail(issueId),
    enabled: Number.isInteger(issueId) && issueId > 0,
  })

  if (isLoading) return <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-600">Loading issue…</main>
  if (isError || !issue) return <main className="mx-auto max-w-3xl px-4 py-10"><p className="text-red-600">Issue not found or unavailable.</p><Link to="/report" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">Back to reporting</Link></main>

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/report" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Report another issue</Link>
      <article className="mt-4 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm text-slate-500">Issue #{issue.id}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{issue.title}</h1></div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">{statusLabels[issue.status]}</span>
        </div>
        <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">{issue.description}</p>
        <dl className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</dt><dd className="mt-1 font-medium capitalize text-slate-900">{issue.priority}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported</dt><dd className="mt-1 text-slate-700">{new Date(issue.created_at).toLocaleString()}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt><dd className="mt-1 text-slate-700">{issue.address || `${issue.latitude}, ${issue.longitude}`}</dd></div>
        </dl>
      </article>
    </main>
  )
}
