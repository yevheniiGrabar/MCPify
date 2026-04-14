import { useCurrentUser } from '@/api/auth'
import { Navigate, Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
