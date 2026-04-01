import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import SubjectCard from '../../components/dashboard/SubjectCard'
import StreakCounter from '../../components/dashboard/StreakCounter'

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
      } catch (_error) {
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
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Panel del Estudiante</h1>
          <p className="mt-2 text-slate-600">
            Bienvenido, <span className="font-semibold text-slate-900">{user?.name}</span>. Aqui puedes seguir tu avance por materia.
          </p>
        </header>

        <StreakCounter
          currentStreak={user?.currentStreak || 0}
          longestStreak={user?.longestStreak || user?.currentStreak || 0}
        />

        <section>
          <h2 className="mb-4 text-xl font-extrabold text-slate-900">Materias y maestria</h2>

          {loading ? <p className="text-sm text-slate-600">Cargando materias y progreso...</p> : null}
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

          {!loading && !error && !hasSubjects ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
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
