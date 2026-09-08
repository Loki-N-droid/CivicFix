import api from './api'
import type { Notification, NotificationListResponse } from '../types/notification'

export async function fetchNotifications(page = 1, pageSize = 20): Promise<NotificationListResponse> {
  const { data } = await api.get<NotificationListResponse>('/api/v1/notifications/', {
    params: { page, page_size: pageSize },
  })
  return data
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/api/v1/notifications/unread-count')
  return data.count
}

export async function markNotificationRead(notificationId: number): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/api/v1/notifications/${notificationId}/read`)
  return data
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/api/v1/notifications/read-all')
}
