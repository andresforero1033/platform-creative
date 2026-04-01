import { useAuth } from '../context/AuthContext'

function Profile() {
  const { user } = useAuth()
  const badges = Array.isArray(user?.badges) ? user.badges : []

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Mi Perfil</h1>
          <p className="mt-3 text-slate-600">Informacion de tu cuenta y logros obtenidos.</p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">Medallas ganadas</h2>
          {badges.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Todavia no tienes medallas. Completa retos para desbloquearlas.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {badges.map((badge) => (
                <li
                  key={badge.badgeId || badge._id || badge.id || badge.code || badge.name || badge.nombre}
                  className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4"
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
