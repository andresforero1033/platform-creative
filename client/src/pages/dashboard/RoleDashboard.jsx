import useAuth from '../../hooks/useAuth'

function RoleDashboard() {
  const { user, logout } = useAuth()

  return (
    <main className="app-shell overflow-hidden py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
      </div>

      <section className="app-content-narrow">
        <div className="glass-panel p-8">
          <p className="glass-badge-blue">Vista de rol</p>
          <h1 className="mt-4 text-3xl font-black text-slate-900">Dashboard {user?.role}</h1>
          <p className="mt-3 text-slate-600">
            Sesion activa para <span className="font-semibold">{user?.name}</span> ({user?.email})
          </p>
          <button
            type="button"
            onClick={logout}
            className="glass-cta-primary mt-8"
          >
            Cerrar sesion
          </button>
        </div>
      </section>
    </main>
  )
}

export default RoleDashboard
