export type NotificationType =
  | 'issue_status_updated'
  | 'issue_resolved'
  | 'high_priority_issue'

export type Notification = {
  id: number
  issue_id: number | null
  issue_title: string | null
  title: string
  message: string
  notification_type: NotificationType
  is_read: boolean
  created_at: string
  read_at: string | null
}

export type NotificationListResponse = {
  items: Notification[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
