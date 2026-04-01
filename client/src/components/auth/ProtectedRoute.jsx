import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-semibold text-slate-600">Verificando sesion...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
