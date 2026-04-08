import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard'
import { DashboardPageSkeleton } from '../../components/feedback/LoadingSkeletons'
import EmptyState from '../../components/feedback/EmptyState'

const INITIAL_FORM = {
  subjectId: '',
  title: '',
  content: '',
}

function TeacherDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [formFeedback, setFormFeedback] = useState({ type: '', message: '' })
  const titleInputRef = useRef(null)

  const teacherId = user?.id || user?._id

  useEffect(() => {
    let isMounted = true

    const loadTeacherDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [subjectsResponse, feedbackResponse] = await Promise.all([
          api.get('/student/subjects'),
          api.get('/teacher/my-feedback'),
        ])

        const fetchedSubjects = Array.isArray(subjectsResponse?.data?.data)
          ? subjectsResponse.data.data
          : []
        const fetchedFeedback = Array.isArray(feedbackResponse?.data?.data)
          ? feedbackResponse.data.data
          : []

        if (isMounted) {
          setSubjects(fetchedSubjects)
          setFeedback(fetchedFeedback)
        }
      } catch {
        if (isMounted) {
          setError('No pudimos cargar el panel docente.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTeacherDashboard()

    return () => {
      isMounted = false
    }
  }, [reloadTick])

  useEffect(() => {
    if (!form.subjectId && subjects.length > 0) {
      const firstSubjectId = subjects[0]?._id || subjects[0]?.id || ''
      setForm((previous) => ({ ...previous, subjectId: firstSubjectId }))
    }
  }, [subjects, form.subjectId])

  const assignedSubjects = useMemo(() => {
    if (!teacherId) return []

    return subjects
      .map((subject) => {
        const subjectLessons = Array.isArray(subject.lessons) ? subject.lessons : []
        const ownLessons = subjectLessons.filter((lesson) => String(lesson.teacherId) === String(teacherId))

        if (!ownLessons.length) {
          return null
        }

        return {
          ...subject,
          ownLessons,
        }
      })
      .filter(Boolean)
  }, [subjects, teacherId])

  const pendingFeedback = useMemo(
    () => feedback.filter((item) => item.status !== 'resolved'),
    [feedback],
  )

  const totalAssignedLessons = useMemo(
    () => assignedSubjects.reduce((acc, subject) => acc + subject.ownLessons.length, 0),
    [assignedSubjects],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setFormFeedback({ type: '', message: '' })
  }

  const handleCreateLesson = async (event) => {
    event.preventDefault()

    if (!form.subjectId || !form.title.trim() || !form.content.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Completa materia, titulo y contenido para crear la leccion.',
      })
      return
    }

    setCreatingLesson(true)
    setFormFeedback({ type: '', message: '' })

    try {
      await api.post(
        `/teacher/subjects/${form.subjectId}/lessons`,
        {
          title: form.title.trim(),
          content: form.content.trim(),
        },
        { skipGlobalErrorToast: true },
      )

      const refreshedSubjectsResponse = await api.get('/student/subjects', { skipGlobalErrorToast: true })
      const refreshedSubjects = Array.isArray(refreshedSubjectsResponse?.data?.data)
        ? refreshedSubjectsResponse.data.data
        : []

      setSubjects(refreshedSubjects)
      setForm((previous) => ({ ...previous, title: '', content: '' }))
      setFormFeedback({ type: 'success', message: 'Leccion creada correctamente.' })
      toast.success('Leccion publicada con exito.')
    } catch (requestError) {
      const backendMessage = requestError?.response?.data?.message
      const validationMessage = requestError?.response?.data?.data?.[0]?.msg

      setFormFeedback({
        type: 'error',
        message: validationMessage || backendMessage || 'No se pudo crear la leccion.',
      })
    } finally {
      setCreatingLesson(false)
    }
  }

  const focusCreateLessonForm = () => {
    titleInputRef.current?.focus()
    titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (loading) {
    return (
      <main className="app-shell overflow-hidden py-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
        </div>
        <section className="app-content">
          <DashboardPageSkeleton metricCount={3} leftCards={3} rightCards={2} />
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
      </div>

      <section className="app-content space-y-6">
        <header className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-blue">Teacher</p>
            <p className="glass-badge-purple">Classroom Manager</p>
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Panel Docente</h1>
          <p className="mt-2 text-slate-600">
            Gestiona materias, crea lecciones y atiende feedback de supervision.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <DashboardMetricCard
            label="Materias asignadas"
            value={assignedSubjects.length}
            description="Materias donde ya impartes lecciones"
            tone="blue"
          />
          <DashboardMetricCard
            label="Lecciones activas"
            value={totalAssignedLessons}
            description="Total de lecciones asociadas a tu perfil"
            tone="purple"
          />
          <DashboardMetricCard
            label="Feedback pendiente"
            value={pendingFeedback.length}
            description="Observaciones abiertas por revisar"
            tone="yellow"
          />
        </section>

        {error ? (
          <div className="glass-panel space-y-3 border-red-200/70 bg-red-50/70 p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              className="glass-cta-primary"
              onClick={() => setReloadTick((previous) => previous + 1)}
            >
              Reintentar carga
            </button>
          </div>
        ) : null}

        {!error ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-900">Materias asignadas</h2>
                <span className="glass-badge-blue">Vista de control</span>
              </div>

              {assignedSubjects.length === 0 ? (
                <EmptyState
                  title="Aun sin materias activas"
                  description="Todavia no hay materias vinculadas a tu perfil docente. Mientras tanto, prepara tu primera leccion para publicarla rapido cuando se habilite una materia."
                  ctaLabel="Ir a crear leccion"
                  ctaOnClick={focusCreateLessonForm}
                />
              ) : (
                <div className="space-y-3">
                  {assignedSubjects.map((subject) => {
                    const subjectId = subject._id || subject.id
                    return (
                      <article key={subjectId} className="glass-card border-brand-blue/20 p-4">
                        <h3 className="text-lg font-black text-slate-900">{subject.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">Lecciones tuyas: {subject.ownLessons.length}</p>
                        <ul className="mt-3 space-y-1 text-sm text-slate-700">
                          {subject.ownLessons.slice(0, 3).map((lesson) => (
                            <li key={lesson._id || lesson.id}>• {lesson.title}</li>
                          ))}
                          {subject.ownLessons.length > 3 ? (
                            <li className="text-xs font-semibold text-brand-blue">
                              +{subject.ownLessons.length - 3} lecciones mas
                            </li>
                          ) : null}
                        </ul>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <article className="glass-panel p-6">
                <h2 className="text-xl font-extrabold text-slate-900">Crear leccion</h2>
                <p className="mt-1 text-sm text-slate-600">Acceso rapido para agregar contenido a una materia.</p>

                <form className="mt-4 space-y-3" onSubmit={handleCreateLesson}>
                  <select
                    name="subjectId"
                    value={form.subjectId}
                    onChange={handleChange}
                    className="glass-select"
                    required
                  >
                    {subjects.map((subject) => {
                      const subjectId = subject._id || subject.id
                      return <option key={subjectId} value={subjectId}>{subject.name}</option>
                    })}
                  </select>

                  <input
                    ref={titleInputRef}
                    id="teacher-create-lesson-title"
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="glass-input"
                    placeholder="Titulo de la leccion"
                    required
                  />

                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    className="glass-input min-h-[120px] resize-y"
                    placeholder="Contenido de la leccion"
                    required
                  />

                  {formFeedback.message ? (
                    <p className={formFeedback.type === 'success' ? 'glass-panel border-brand-blue/25 bg-brand-blue/10 p-3 text-sm font-semibold text-brand-blue' : 'glass-error'}>
                      {formFeedback.message}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="glass-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-80"
                    disabled={creatingLesson}
                  >
                    {creatingLesson ? 'Creando...' : 'Crear leccion'}
                  </button>
                </form>
              </article>

              <article className="glass-panel p-6">
                <h2 className="text-xl font-extrabold text-slate-900">Feedback pendiente</h2>
                {pendingFeedback.length === 0 ? (
                  <EmptyState
                    title="Sin observaciones abiertas"
                    description="Tu bandeja esta limpia. Cuando llegue nueva retroalimentacion de supervision aparecera aqui."
                  />
                ) : (
                  <ul className="mt-3 space-y-2">
                    {pendingFeedback.slice(0, 4).map((item) => (
                      <li key={item._id || item.id} className="glass-card border-brand-yellow/30 p-3">
                        <p className="text-sm text-slate-700">{item.content}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString('es-CO')}
                        </p>
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

export default TeacherDashboard
