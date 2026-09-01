export type IssueSeverity = 'low' | 'medium' | 'high'

export type IssueStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'closed'

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'

export type IssueImage = {
  id: number
  filename: string
  original_filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

export type Issue = {
  id: number
  title: string
  description: string
  category_id: number
  citizen_id: number
  status: IssueStatus
  citizen_severity: IssueSeverity
  latitude: number
  longitude: number
  address: string | null
  priority: PriorityLevel
  priority_score: number
  priority_is_overridden: boolean
  priority_overridden_by: number | null
  priority_override_reason: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  images: IssueImage[]
}

export type StatusCount = {
  status: IssueStatus
  count: number
}

export type PriorityCount = {
  priority: PriorityLevel
  count: number
}

export type CategoryCount = {
  category_id: number
  category_name: string
  count: number
}

export type MonthlyCount = {
  month: string // "YYYY-MM"
  count: number
}

export type DashboardStats = {
  total_issues: number
  status_counts: StatusCount[]
  priority_counts: PriorityCount[]
  category_counts: CategoryCount[]
  monthly_trend: MonthlyCount[]
}

export type CreateIssuePayload = {
  title: string
  description: string
  category_id: number
  citizen_severity: IssueSeverity
  latitude: number
  longitude: number
  address?: string | null
  images: File[]
}

// --- Admin issue management ---

export type IssueSortOption = 'newest' | 'oldest' | 'priority_score'

export type IssueListItem = {
  id: number
  title: string
  category_id: number
  category_name: string
  citizen_id: number
  citizen_name: string
  status: IssueStatus
  priority: PriorityLevel
  priority_score: number
  priority_is_overridden: boolean
  address: string | null
  created_at: string
  updated_at: string
}

export type IssueListResponse = {
  items: IssueListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type AdminIssueListParams = {
  search?: string
  status?: IssueStatus
  category_id?: number
  priority?: PriorityLevel
  date_from?: string
  date_to?: string
  sort?: IssueSortOption
  page?: number
  page_size?: number
}
