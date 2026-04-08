import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <main className="auth-shell">
        <div className="auth-glow-blue" />
        <div className="auth-glow-purple" />
        <section className="glass-panel space-y-3 px-6 py-5">
          <p className="glass-badge-blue">Autenticacion</p>
          <p className="text-sm font-semibold text-slate-600">Verificando sesion...</p>
        </section>
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
