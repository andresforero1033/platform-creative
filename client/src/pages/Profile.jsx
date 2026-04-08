import useAuth from '../hooks/useAuth'

function Profile() {
  const { user } = useAuth()
  const badges = Array.isArray(user?.badges) ? user.badges : []

  return (
    <main className="app-shell overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="absolute -right-8 top-20 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-brand-yellow/20 blur-3xl" />
      </div>

      <section className="app-content-narrow space-y-6">
        <header className="glass-panel p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-purple">Mi Perfil</p>
            <p className="glass-badge-blue">Cuenta activa</p>
          </div>

          <h1 className="mt-4 text-3xl font-black text-slate-900">Mi Perfil</h1>
          <p className="mt-3 text-slate-600">Informacion de tu cuenta y logros obtenidos.</p>
        </header>

        <section className="glass-panel p-6">
          <h2 className="text-xl font-extrabold text-slate-900">Datos de usuario</h2>
          <dl className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Nombre</dt>
              <dd>{user?.name || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Email</dt>
              <dd>{user?.email || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Rol</dt>
              <dd className="capitalize">{user?.role || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Puntos</dt>
              <dd>{user?.points || 0}</dd>
            </div>
          </dl>
        </section>

        <section className="glass-panel p-6">
          <h2 className="text-xl font-extrabold text-slate-900">Medallas ganadas</h2>
          {badges.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Todavia no tienes medallas. Completa retos para desbloquearlas.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {badges.map((badge) => (
                <li
                  key={badge.badgeId || badge._id || badge.id || badge.code || badge.name || badge.nombre}
                  className="glass-card border-brand-purple/25 p-4"
                >
                  <p className="font-bold text-brand-purple">{badge.name || badge.nombre || 'Medalla'}</p>
                  <p className="mt-1 text-sm text-slate-600">Logro desbloqueado por tu progreso.</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

export default Profile
