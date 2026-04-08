import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import SubjectCard from '../../components/dashboard/SubjectCard'
import StreakCounter from '../../components/dashboard/StreakCounter'

const MotionHeader = motion.header

function buildMasteryBySubject(subjects = [], reviewItems = []) {
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
    accumulator[subjectId] = Math.max(0, Math.min(100, computedMastery))
    return accumulator
  }, {})
}

function StudentDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [masteryBySubject, setMasteryBySubject] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setLoading(true)
      setError('')

      try {
        const [subjectsResponse, progressResponse] = await Promise.all([
          api.get('/student/subjects'),
          api.get('/student/recommendations/review').catch(() => ({ data: { data: [] } })),
        ])

        const fetchedSubjects = Array.isArray(subjectsResponse?.data?.data)
          ? subjectsResponse.data.data
          : []
        const reviewItems = Array.isArray(progressResponse?.data?.data)
          ? progressResponse.data.data
          : []

        if (isMounted) {
          setSubjects(fetchedSubjects)
          setMasteryBySubject(buildMasteryBySubject(fetchedSubjects, reviewItems))
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
  }, [])

  const hasSubjects = useMemo(() => subjects.length > 0, [subjects])

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

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">Materias y maestria</h2>
            <span className="glass-badge-yellow">Seguimiento semanal</span>
          </div>

          {loading ? (
            <p className="glass-panel p-4 text-sm font-semibold text-slate-600">Cargando materias y progreso...</p>
          ) : null}

          {error ? (
            <p className="glass-error">{error}</p>
          ) : null}

          {!loading && !error && !hasSubjects ? (
            <p className="glass-panel p-4 text-sm text-slate-600">
              Aun no tienes materias asignadas.
            </p>
          ) : null}

          {!loading && !error && hasSubjects ? (
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((subject, index) => {
                const subjectId = subject._id || subject.id
                return (
                  <SubjectCard
                    key={subjectId}
                    subject={subject}
                    mastery={masteryBySubject[subjectId] || 0}
                    index={index}
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
