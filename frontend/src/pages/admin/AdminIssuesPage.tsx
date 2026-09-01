import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { fetchAdminIssues } from '../../services/issues'
import { fetchCategories } from '../../services/categories'
import StatusBadge from '../../components/admin/StatusBadge'
import PriorityBadge from '../../components/admin/PriorityBadge'
import type { IssueSortOption, IssueStatus, PriorityLevel } from '../../types/issue'
import { STATUS_LABELS, PRIORITY_LABELS } from '../../components/admin/chartTheme'

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as IssueStatus[]
const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABELS) as PriorityLevel[]

const SORT_OPTIONS: { value: IssueSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority_score', label: 'Priority score' },
]

const PAGE_SIZE = 20

type Filters = {
  status: IssueStatus | ''
  categoryId: string
  priority: PriorityLevel | ''
  dateFrom: string
  dateTo: string
  sort: IssueSortOption
}

const EMPTY_FILTERS: Filters = {
  status: '',
  categoryId: '',
  priority: '',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <div className="h-4 w-10 animate-pulse rounded bg-slate-100" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  )
}

export default function AdminIssuesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(searchInput)

  function updateFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearchInput(value)
    setPage(1)
  }

  function clearFilters() {
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    filters.status !== '' ||
    filters.categoryId !== '' ||
    filters.priority !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [
      'admin',
      'issues',
      {
        search: debouncedSearch.trim(),
        status: filters.status,
        categoryId: filters.categoryId,
        priority: filters.priority,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sort: filters.sort,
        page,
      },
    ],
    queryFn: () =>
      fetchAdminIssues({
        search: debouncedSearch.trim() || undefined,
        status: filters.status || undefined,
        category_id: filters.categoryId ? Number(filters.categoryId) : undefined,
        priority: filters.priority || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        sort: filters.sort,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const totalPages = data?.total_pages ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Issues
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and manage every citizen report.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
            Search
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by ID, title, or description"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 lg:max-w-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-end">
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => updateFilters({ status: v })}
              options={[
                { value: '', label: 'All statuses' },
                ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
              ]}
            />
            <FilterSelect
              label="Category"
              value={filters.categoryId}
              onChange={(v) => updateFilters({ categoryId: v })}
              options={[
                { value: '', label: 'All categories' },
                ...(categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []),
              ]}
            />
            <FilterSelect
              label="Priority"
              value={filters.priority}
              onChange={(v) => updateFilters({ priority: v })}
              options={[
                { value: '', label: 'All priorities' },
                ...PRIORITY_OPTIONS.map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
              ]}
            />
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              From
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              To
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilters({ dateTo: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </label>
            <FilterSelect
              label="Sort by"
              value={filters.sort}
              onChange={(v) => updateFilters({ sort: v })}
              options={SORT_OPTIONS}
            />
          </div>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            Clear all filters
          </button>
        ) : null}
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Couldn't load issues.{' '}
          {isAxiosError(error) && error.response?.status === 403
            ? 'Your account does not have administrator access.'
            : 'Please try refreshing the page.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <TableSkeleton />
          ) : !data || data.items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-600">No issues match these filters</p>
              <p className="mt-1 text-sm text-slate-400">
                Try widening your search or clearing a filter.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3 sm:px-6">ID</th>
                      <th className="px-4 py-3 sm:px-6">Title</th>
                      <th className="px-4 py-3 sm:px-6">Category</th>
                      <th className="px-4 py-3 sm:px-6">Citizen</th>
                      <th className="px-4 py-3 sm:px-6">Status</th>
                      <th className="px-4 py-3 sm:px-6">Priority</th>
                      <th className="px-4 py-3 sm:px-6">Reported</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((issue) => (
                      <tr key={issue.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 sm:px-6">
                          #{issue.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">
                          {issue.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-6">
                          {issue.category_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-6">
                          {issue.citizen_name}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <PriorityBadge
                            priority={issue.priority}
                            isOverridden={issue.priority_is_overridden}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-500 sm:px-6">
                          {formatDate(issue.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-slate-500">
                  Showing{' '}
                  <span className="font-medium text-slate-700">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)}
                  </span>{' '}
                  of <span className="font-medium text-slate-700">{data.total}</span> issues
                  {isFetching ? ' · updating…' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {page} of {totalPages || 1}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
