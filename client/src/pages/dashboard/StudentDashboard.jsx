import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import SubjectCard from '../../components/dashboard/SubjectCard'
import StreakCounter from '../../components/dashboard/StreakCounter'
import { DashboardPageSkeleton } from '../../components/feedback/LoadingSkeletons'
import EmptyState from '../../components/feedback/EmptyState'
import { getFirstPendingLesson, getMasteredLessonsCount } from '../../utils/lessonProgress'

const MotionHeader = motion.header

function buildMasteryBySubject(subjects = [], reviewItems = [], userId) {
  const reviewBySubject = reviewItems.reduce((accumulator, item) => {
    const subjectId = item.subjectId || item.subject || item.subject_id
    if (!subjectId) return accumulator

    accumulator[subjectId] = (accumulator[subjectId] || 0) + 1
    return accumulator
  }, {})

  return subjects.reduce((accumulator, subject) => {
    const subjectId = subject._id || subject.id
    const totalLessons = Array.isArray(subject.lessons) ? subject.lessons.length : 0

    if (!subjectId || totalLessons === 0) {
      accumulator[subjectId] = 0
      return accumulator
    }

    const dueReviews = reviewBySubject[subjectId] || 0
    const computedMastery = ((totalLessons - Math.min(dueReviews, totalLessons)) / totalLessons) * 100
    const masteredLessonsLocal = getMasteredLessonsCount(userId, subjectId, subject.lessons || [])
    const masteryFromLocal = (masteredLessonsLocal / totalLessons) * 100

    accumulator[subjectId] = Math.max(0, Math.min(100, Math.max(computedMastery, masteryFromLocal)))
    return accumulator
  }, {})
}

function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [masteryBySubject, setMasteryBySubject] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [classCode, setClassCode] = useState('')
  const [enrollingClass, setEnrollingClass] = useState(false)
  const [enrollFeedback, setEnrollFeedback] = useState({ type: '', message: '' })
  const userId = user?.id || user?._id

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setLoading(true)
      setError('')

      try {
        const [subjectsResponse, progressResponse] = await Promise.all([
          api.get('/student/subjects'),
          api.get('/student/recommendations/review', { skipGlobalErrorToast: true }).catch(() => ({ data: { data: [] } })),
        ])

        const fetchedSubjects = Array.isArray(subjectsResponse?.data?.data)
          ? subjectsResponse.data.data
          : []
        const reviewItems = Array.isArray(progressResponse?.data?.data)
          ? progressResponse.data.data
          : []

        if (isMounted) {
          setSubjects(fetchedSubjects)
          setMasteryBySubject(buildMasteryBySubject(fetchedSubjects, reviewItems, userId))
        }
      } catch {
        if (isMounted) {
          setError('No pudimos cargar tu progreso ahora mismo.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [userId, reloadTick])

  useEffect(() => {
    const handleQuizMastered = (event) => {
      const changedSubjectId = event?.detail?.subjectId
      if (!changedSubjectId) return

      const subject = subjects.find((item) => String(item?._id || item?.id) === String(changedSubjectId))
      if (!subject) return

      const totalLessons = Array.isArray(subject.lessons) ? subject.lessons.length : 0
      if (totalLessons === 0) return

      const masteredCount = getMasteredLessonsCount(userId, changedSubjectId, subject.lessons)
      const localMastery = Math.round((masteredCount / totalLessons) * 100)

      setMasteryBySubject((previous) => ({
        ...previous,
        [changedSubjectId]: Math.max(previous[changedSubjectId] || 0, localMastery),
      }))
    }

    window.addEventListener('creative:quiz-mastered', handleQuizMastered)

    return () => {
      window.removeEventListener('creative:quiz-mastered', handleQuizMastered)
    }
  }, [subjects, userId])

  const hasSubjects = useMemo(() => subjects.length > 0, [subjects])

  const handleOpenLesson = (subject) => {
    const firstPendingLesson = getFirstPendingLesson(subject, userId)
    const subjectId = subject?._id || subject?.id
    const lessonId = firstPendingLesson?._id || firstPendingLesson?.id

    if (!subjectId || !lessonId) {
      return
    }

    navigate(`/subjects/${subjectId}/lessons/${lessonId}`)
  }

  const handleEnrollByClassCode = async (event) => {
    event.preventDefault()

    const normalizedCode = classCode.trim().toUpperCase()
    if (!normalizedCode) {
      setEnrollFeedback({ type: 'error', message: 'Ingresa un ClassCode valido.' })
      return
    }

    setEnrollingClass(true)
    setEnrollFeedback({ type: '', message: '' })

    try {
      const response = await api.post(
        '/student/classes/enroll',
        { classCode: normalizedCode },
        { skipGlobalErrorToast: true },
      )

      const backendMessage = response?.data?.message || 'Inscripcion realizada correctamente.'
      setClassCode('')
      setEnrollFeedback({ type: 'success', message: backendMessage })
      toast.success(backendMessage)
      setReloadTick((previous) => previous + 1)
    } catch (requestError) {
      const validationMessage = requestError?.response?.data?.data?.[0]?.msg
      const backendMessage = requestError?.response?.data?.message
      const message = validationMessage || backendMessage || 'No se pudo completar la inscripcion.'

      setEnrollFeedback({ type: 'error', message })
    } finally {
      setEnrollingClass(false)
    }
  }

  if (loading) {
    return (
      <main className="app-shell overflow-hidden py-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-brand-yellow/20 blur-3xl" />
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
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-brand-yellow/20 blur-3xl" />
      </div>

      <section className="app-content space-y-6">
        <MotionHeader
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-panel p-6 md:p-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-blue">Dashboard</p>
            <p className="glass-badge-purple">Student View</p>
          </div>

          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Panel del Estudiante</h1>
          <p className="mt-2 text-slate-600">
            Bienvenido, <span className="font-semibold text-slate-900">{user?.name}</span>. Aqui puedes seguir tu avance por materia.
          </p>
        </MotionHeader>

        <StreakCounter
          currentStreak={user?.currentStreak || 0}
          longestStreak={user?.longestStreak || user?.currentStreak || 0}
        />

        <section className="glass-panel p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Inscribirme con ClassCode</h2>
            <span className="glass-badge-blue">Acceso por codigo</span>
          </div>

          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleEnrollByClassCode}>
            <input
              type="text"
              value={classCode}
              onChange={(event) => {
                setClassCode(event.target.value)
                setEnrollFeedback({ type: '', message: '' })
              }}
              className="glass-input"
              placeholder="Ej: CL8Y2KQ7P"
              required
            />
            <button
              type="submit"
              className="glass-cta-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-80"
              disabled={enrollingClass}
            >
              {enrollingClass ? 'Inscribiendo...' : 'Inscribirme'}
            </button>
          </form>

          {enrollFeedback.message ? (
            <p className={`mt-3 ${enrollFeedback.type === 'success' ? 'glass-panel border-brand-blue/25 bg-brand-blue/10 p-3 text-sm font-semibold text-brand-blue' : 'glass-error'}`}>
              {enrollFeedback.message}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">Materias y maestria</h2>
            <span className="glass-badge-yellow">Seguimiento semanal</span>
          </div>

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

          {!error && !hasSubjects ? (
            <EmptyState
              title="Sin materias asignadas"
              description="Todavia no tienes materias activas. Usa un ClassCode de tu docente para inscribirte y ver tus materias aqui."
              ctaLabel="Ver perfil"
              ctaTo="/profile"
            />
          ) : null}

          {!error && hasSubjects ? (
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((subject, index) => {
                const subjectId = subject._id || subject.id
                return (
                  <SubjectCard
                    key={subjectId}
                    subject={subject}
                    mastery={masteryBySubject[subjectId] || 0}
                    index={index}
                    onOpenLesson={handleOpenLesson}
                  />
                )
              })}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

export default StudentDashboard
