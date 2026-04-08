import { useEffect, useState } from 'react'
import api from '../../api/axios'
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard'

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function ParentDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadParentDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/parent/dashboard')
        const payload = response?.data?.data || null

        if (isMounted) {
          setDashboard(payload)
        }
      } catch {
        if (isMounted) {
          setError('No pudimos cargar el dashboard parental.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadParentDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const summary = dashboard?.summary || {}
  const children = Array.isArray(dashboard?.children) ? dashboard.children : []
  const progressBySubject = Array.isArray(dashboard?.progressBySubject)
    ? dashboard.progressBySubject
    : []
  const recentBadges = Array.isArray(dashboard?.recentBadges) ? dashboard.recentBadges : []
  const nextReview = dashboard?.nextReview || null

  return (
    <main className="app-shell overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-yellow/20 blur-3xl" />
      </div>

      <section className="app-content space-y-6">
        <header className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-blue">Parent</p>
            <p className="glass-badge-yellow">Family Pulse</p>
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Dashboard de Padres</h1>
          <p className="mt-2 text-slate-600">
            Revisa avance, recordatorios de repaso y logros recientes de tus hijos.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Hijos vinculados"
            value={summary.linkedChildren || 0}
            description="Estudiantes asociados a tu cuenta"
            tone="blue"
          />
          <DashboardMetricCard
            label="Materias en progreso"
            value={summary.subjectsInProgress || 0}
            description="Con avance activo"
            tone="purple"
          />
          <DashboardMetricCard
            label="Materias completadas"
            value={summary.completedSubjects || 0}
            description="Con dominio total"
            tone="yellow"
          />
          <DashboardMetricCard
            label="Maestria promedio"
            value={`${summary.averageMastery || 0}%`}
            description="Promedio global de tus hijos"
            tone="purple"
          />
        </section>

        {loading ? <p className="glass-panel p-4 text-sm font-semibold text-slate-600">Cargando dashboard parental...</p> : null}
        {error ? <p className="glass-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <article className="glass-panel p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold text-slate-900">Hijos y actividad</h2>
                  <span className="glass-badge-blue">Vista familiar</span>
                </div>

                {children.length === 0 ? (
                  <p className="text-sm text-slate-600">Aun no hay hijos vinculados para mostrar.</p>
                ) : (
                  <div className="space-y-3">
                    {children.map((child) => (
                      <article key={child.id} className="glass-card border-brand-blue/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-black text-slate-900">{child.name}</h3>
                          <span className="glass-badge-blue text-[11px]">{child.points || 0} pts</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Racha actual: <span className="font-semibold text-slate-900">{child.currentStreak || 0} dias</span>
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </article>

              <article className="glass-panel p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold text-slate-900">Proxima sesion de repaso</h2>
                  <span className="glass-badge-yellow">Recordatorio</span>
                </div>

                {nextReview ? (
                  <div className="glass-card border-brand-yellow/30 p-4">
                    <p className="text-sm font-semibold text-slate-700">{nextReview.studentName}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">{nextReview.lessonTitle}</h3>
                    <p className="mt-1 text-sm text-slate-600">{nextReview.subjectName}</p>
                    <p className="mt-3 text-sm text-amber-700">
                      Fecha sugerida: {formatDate(nextReview.nextReviewDate)} | Nivel SRS: {nextReview.reviewLevel || 0}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No hay repasos pendientes por ahora.</p>
                )}
              </article>
            </section>

            <section className="space-y-6">
              <article className="glass-panel p-6">
                <h2 className="text-xl font-extrabold text-slate-900">Avance por materia</h2>
                {progressBySubject.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">Sin datos de progreso por materia todavia.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {progressBySubject.map((item) => (
                      <article key={item.subjectId} className="glass-card border-brand-purple/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-slate-900">{item.subjectName}</h3>
                          <span className="text-sm font-semibold text-brand-purple">{item.averageMastery}%</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-200/80">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple"
                            style={{ width: `${Math.max(5, item.averageMastery || 0)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          {item.trackedChildren} hijos con avance en esta materia.
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </article>

              <article className="glass-panel p-6">
                <h2 className="text-xl font-extrabold text-slate-900">Insignias recientes</h2>
                {recentBadges.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">Aun no hay insignias recientes.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {recentBadges.map((badge, index) => (
                      <li
                        key={`${badge.studentId}-${badge.badgeId}-${index}`}
                        className="glass-card border-brand-yellow/25 p-3"
                      >
                        <p className="text-sm font-bold text-slate-900">{badge.studentName}</p>
                        <p className="text-xs text-slate-600">{badge.nombre}</p>
                        <p className="mt-1 text-xs text-amber-700">{formatDate(badge.awardedAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default ParentDashboard
