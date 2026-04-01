import useAuth from '../../hooks/useAuth'

function RoleDashboard() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-900">Dashboard {user?.role}</h1>
        <p className="mt-3 text-slate-600">
          Sesion activa para <span className="font-semibold">{user?.name}</span> ({user?.email})
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-8 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white"
        >
          Cerrar sesion
        </button>
      </section>
    </main>
  )
}

export default RoleDashboard
