import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications'
import type { Notification } from '../types/notification'

function formatTime(value: string): string {
  const date = new Date(value)
  const seconds = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 1000),
  )

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`

  return date.toLocaleDateString()
}

function BellIcon() {
  return (
    <span aria-hidden="true" className="text-xl leading-none">
      🔔
    </span>
  )
}

export default function CitizenLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const {
    data: unreadCount = 0,
    isLoading: isUnreadCountLoading,
  } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  const {
    data: recentNotifications,
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
  } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => fetchNotifications(1, 8),
    enabled: Boolean(user),
    staleTime: 30_000,
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications'],
      })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications'],
      })
    },
  })

  function openNotification(notification: Notification) {
    if (!notification.is_read) {
      readMutation.mutate(notification.id)
    }

    setIsOpen(false)

    if (notification.issue_id) {
      navigate(`/issues/${notification.issue_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/report"
            className="text-xl font-bold text-slate-900"
          >
            CivicFix
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/report"
              className="hidden rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 sm:inline-block"
            >
              Report an issue
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications${
                  unreadCount ? `, ${unreadCount} unread` : ''
                }`}
                onClick={() => setIsOpen((open) => !open)}
                className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100"
              >
                <BellIcon />

                {!isUnreadCountLoading && unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {isOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <h2 className="font-semibold text-slate-900">
                      Notifications
                    </h2>

                    <button
                      type="button"
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => readAllMutation.mutate()}
                      disabled={
                        !unreadCount ||
                        readAllMutation.isPending
                      }
                    >
                      {readAllMutation.isPending
                        ? 'Marking...'
                        : 'Mark all read'}
                    </button>
                  </div>

                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {/* Loading */}
                    {isNotificationsLoading ? (
                      <p className="px-2 py-6 text-center text-sm text-slate-500">
                        Loading notifications...
                      </p>
                    ) : null}

                    {/* API Error */}
                    {!isNotificationsLoading &&
                    isNotificationsError ? (
                      <p className="px-2 py-6 text-center text-sm text-red-600">
                        Could not load notifications.
                      </p>
                    ) : null}

                    {/* Notifications */}
                    {!isNotificationsLoading &&
                    !isNotificationsError &&
                    recentNotifications &&
                    recentNotifications.items.length > 0
                      ? recentNotifications.items.map(
                          (notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() =>
                                openNotification(notification)
                              }
                              className={`w-full rounded-lg p-3 text-left hover:bg-slate-50 ${
                                notification.is_read
                                  ? ''
                                  : 'bg-blue-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {notification.title}
                                </span>

                                <span className="shrink-0 text-xs text-slate-500">
                                  {formatTime(
                                    notification.created_at,
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {notification.message}
                              </p>
                            </button>
                          ),
                        )
                      : null}

                    {/* Empty State */}
                    {!isNotificationsLoading &&
                    !isNotificationsError &&
                    (!recentNotifications ||
                      recentNotifications.items.length === 0) ? (
                      <p className="px-2 py-6 text-center text-sm text-slate-500">
                        No notifications yet.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <span className="hidden text-slate-500 sm:inline">
              {user?.name}
            </span>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  )
}