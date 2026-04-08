import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard'

function SupervisorDashboard() {
  const [teacherInsights, setTeacherInsights] = useState([])
  const [difficultLessons, setDifficultLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadSupervisorData = async () => {
      setLoading(true)
      setError('')

      try {
        const [insightsResponse, difficultResponse] = await Promise.all([
          api.get('/supervisor/dashboard/teachers'),
          api.get('/supervisor/dashboard/difficult-lessons'),
        ])

        const insights = Array.isArray(insightsResponse?.data?.data)
          ? insightsResponse.data.data
          : []
        const difficult = Array.isArray(difficultResponse?.data?.data)
          ? difficultResponse.data.data
          : []

        if (isMounted) {
          setTeacherInsights(insights)
          setDifficultLessons(difficult)
        }
      } catch {
        if (isMounted) {
          setError('No pudimos cargar el panel de supervision.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSupervisorData()

    return () => {
      isMounted = false
    }
  }, [])

  const topDifficultLessons = useMemo(
    () => [...difficultLessons].sort((a, b) => b.failRate - a.failRate).slice(0, 6),
    [difficultLessons],
  )

  const averageMastery = useMemo(() => {
    if (!teacherInsights.length) return 0
    const sum = teacherInsights.reduce((acc, item) => acc + (item.averageMastery || 0), 0)
    return Math.round(sum / teacherInsights.length)
  }, [teacherInsights])

  const teachersBelowTarget = useMemo(
    () => teacherInsights.filter((item) => (item.averageMastery || 0) < 60).length,
    [teacherInsights],
  )

  const totalAttempts = useMemo(
    () => difficultLessons.reduce((acc, lesson) => acc + (lesson.totalAttempts || 0), 0),
    [difficultLessons],
  )

  const maxFailRate = useMemo(() => {
    if (!topDifficultLessons.length) return 100
    return Math.max(...topDifficultLessons.map((lesson) => lesson.failRate || 0), 1)
  }, [topDifficultLessons])

  return (
    <main className="app-shell overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />
      </div>

      <section className="app-content space-y-6">
        <header className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-purple">Supervisor</p>
            <p className="glass-badge-blue">Insight Hunter</p>
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Panel de Supervision</h1>
          <p className="mt-2 text-slate-600">
            Identifica areas criticas y prioriza intervenciones pedagogicas.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Docentes evaluados"
            value={teacherInsights.length}
            description="Con metricas activas en el periodo"
            tone="blue"
          />
          <DashboardMetricCard
            label="Maestria promedio"
            value={`${averageMastery}%`}
            description="Promedio global de desempeno"
            tone="purple"
          />
          <DashboardMetricCard
            label="Lecciones en riesgo"
            value={topDifficultLessons.length}
            description="Top con mayor tasa de fallo"
            tone="yellow"
          />
          <DashboardMetricCard
            label="Docentes < 60%"
            value={teachersBelowTarget}
            description="Requieren acompanamiento cercano"
            tone="purple"
          />
        </section>

        {loading ? <p className="glass-panel p-4 text-sm font-semibold text-slate-600">Cargando panel supervisor...</p> : null}
        {error ? <p className="glass-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-900">Lecciones mas dificiles</h2>
                <span className="glass-badge-yellow">Total intentos: {totalAttempts}</span>
              </div>

              {topDifficultLessons.length === 0 ? (
                <p className="text-sm text-slate-600">Aun no hay data de dificultad para mostrar.</p>
              ) : (
                <div className="space-y-3">
                  {topDifficultLessons.map((lesson) => {
                    const width = Math.max(8, ((lesson.failRate || 0) / maxFailRate) * 100)

                    return (
                      <article key={`${lesson.subjectId}-${lesson.lessonId}`} className="glass-card border-brand-yellow/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-black text-slate-900">{lesson.lessonTitle}</h3>
                            <p className="text-xs font-semibold text-slate-500">{lesson.subjectName}</p>
                          </div>
                          <p className="text-sm font-bold text-amber-700">{lesson.failRate}% fallo</p>
                        </div>

                        <div className="mt-3 h-2 w-full rounded-full bg-amber-100/80">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-brand-yellow to-brand-purple"
                            style={{ width: `${width}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-slate-600">
                          Intentos: {lesson.totalAttempts} | Fallos: {lesson.totalFails}
                        </p>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="glass-panel p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Desempeno docente</h2>
              {teacherInsights.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">Aun no hay insight docente disponible.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {teacherInsights
                    .slice()
                    .sort((a, b) => (b.averageMastery || 0) - (a.averageMastery || 0))
                    .map((teacher) => (
                      <li key={teacher.teacherId} className="glass-card border-brand-blue/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-900">{teacher.teacherName}</p>
                          <span className="glass-badge-blue text-[11px]">{teacher.averageMastery}%</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          Progresos evaluados: {teacher.evaluatedProgressRows}
                        </p>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default SupervisorDashboard
