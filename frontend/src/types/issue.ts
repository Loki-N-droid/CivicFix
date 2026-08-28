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
