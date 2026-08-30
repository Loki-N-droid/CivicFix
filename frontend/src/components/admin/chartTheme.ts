import type { IssueStatus, PriorityLevel } from '../../types/issue'

// Single source of truth for status/priority display so the dashboard
// charts and the (Package 3) issues table stay visually consistent.

export const STATUS_LABELS: Record<IssueStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const STATUS_COLORS: Record<IssueStatus, string> = {
  submitted: '#94a3b8', // slate-400
  under_review: '#f59e0b', // amber-500
  in_progress: '#3b82f6', // blue-500
  resolved: '#10b981', // emerald-500
  closed: '#475569', // slate-600
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: '#94a3b8', // slate-400
  medium: '#f59e0b', // amber-500
  high: '#f97316', // orange-500
  critical: '#e11d48', // rose-600
}

// The sidebar/brand accent, reused for single-series charts (monthly trend).
export const ACCENT_COLOR = '#14b8a6' // teal-500
