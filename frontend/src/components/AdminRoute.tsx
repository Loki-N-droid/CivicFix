import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Route guard for the /admin section. Unlike ProtectedRoute, this also
 * checks role — an authenticated citizen must never reach admin pages.
 *
 * This is a UX/routing convenience only. It is NOT the source of
 * authorization truth: every admin API route is independently protected
 * server-side by `require_admin` (see backend/app/core/dependencies.py).
 */
export default function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="text-sm text-slate-600">Checking your session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/report" replace />
  }

  return <Outlet />
}
