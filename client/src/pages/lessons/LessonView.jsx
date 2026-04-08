import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import QuizModal from '../../components/quiz/QuizModal'
import {
  getCompletedLessonsCount,
  isLessonCompleted,
  isLessonMastered,
  markLessonCompleted,
  markLessonMastered,
} from '../../utils/lessonProgress'

function lessonIdOf(lesson) {
  return lesson?._id || lesson?.id || ''
}

function getYoutubeEmbedUrl(rawUrl) {
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()

    if (host.includes('youtu.be')) {
      const videoId = url.pathname.replace('/', '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (host.includes('youtube.com')) {
      const videoId = url.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    return null
  } catch {
    return null
  }
}

function parseParagraphs(content) {
  if (!content) return []

  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function LessonView() {
  const { subjectId, lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const userId = user?.id || user?._id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [lessons, setLessons] = useState([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCurrentLessonCompleted, setIsCurrentLessonCompleted] = useState(false)
  const [isCurrentLessonMastered, setIsCurrentLessonMastered] = useState(false)

  const [quiz, setQuiz] = useState(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false)
  const [quizSubmitError, setQuizSubmitError] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [quizSessionId, setQuizSessionId] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadLesson = async () => {
      if (!subjectId || !lessonId) {
        if (isMounted) {
          setError('Ruta de leccion invalida.')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/student/subjects/${subjectId}/lessons/${lessonId}`)
        const payload = response?.data?.data || {}

        if (!isMounted) return

        setSubject(payload.subject || null)
        setLesson(payload.lesson || null)
        setLessons(Array.isArray(payload.lessons) ? payload.lessons : [])
        setIsCurrentLessonCompleted(isLessonCompleted(userId, subjectId, lessonId))
        setIsCurrentLessonMastered(isLessonMastered(userId, subjectId, lessonId))
      } catch {
        if (isMounted) {
          setError('No pudimos cargar la leccion seleccionada.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadLesson()

    return () => {
      isMounted = false
    }
  }, [lessonId, subjectId, userId])

  useEffect(() => {
    if (retryCountdown <= 0) return undefined

    const timeoutId = window.setTimeout(() => {
      setRetryCountdown((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [retryCountdown])

  const currentLessonIndex = useMemo(
    () => lessons.findIndex((item) => String(lessonIdOf(item)) === String(lessonId)),
    [lessonId, lessons],
  )

  const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < lessons.length - 1
    ? lessons[currentLessonIndex + 1]
    : null

  const completedLessonsCount = getCompletedLessonsCount(userId, subjectId, lessons)

  const progressPercent = lessons.length > 0
    ? Math.round((completedLessonsCount / lessons.length) * 100)
    : 0

  const goToLesson = (targetLessonId) => {
    if (!targetLessonId) return
    navigate(`/subjects/${subjectId}/lessons/${targetLessonId}`)
  }

  const openLessonQuiz = async () => {
    if (!subjectId || !lessonId) return

    setIsQuizLoading(true)
    setQuizSubmitError('')
    setQuizResult(null)

    try {
      const response = await api.get(`/student/subjects/${subjectId}/lessons/${lessonId}/quiz`)
      const payload = response?.data?.data || null

      setQuiz(payload)
      setQuizSessionId((previous) => previous + 1)
      setIsQuizOpen(true)
    } catch (requestError) {
      const backendMessage = requestError?.response?.data?.message
      setError(backendMessage || 'No hay quiz disponible para esta leccion por ahora.')
    } finally {
      setIsQuizLoading(false)
    }
  }

  const handleSubmitQuiz = async (answers) => {
    if (!subjectId || !lessonId) return

    setIsQuizSubmitting(true)
    setQuizSubmitError('')

    try {
      const response = await api.post(`/student/subjects/${subjectId}/lessons/${lessonId}/quiz/submit`, {
        answers,
      })

      const payload = response?.data?.data || null
      setQuizResult(payload)

      if (payload?.mastered) {
        markLessonMastered(userId, subjectId, lessonId)
        setIsCurrentLessonMastered(true)
        setRetryCountdown(0)

        window.dispatchEvent(new CustomEvent('creative:quiz-mastered', {
          detail: {
            subjectId,
            lessonId,
            score: payload?.score || 0,
          },
        }))
      } else {
        setRetryCountdown(8)
      }
    } catch (requestError) {
      const backendMessage = requestError?.response?.data?.message
      setQuizSubmitError(backendMessage || 'No se pudo enviar el quiz. Intenta nuevamente.')
    } finally {
      setIsQuizSubmitting(false)
    }
  }

  const handleRetryQuiz = () => {
    if (retryCountdown > 0) return

    setQuizResult(null)
    setQuizSubmitError('')
    setQuizSessionId((previous) => previous + 1)
  }

  const handleCompleteLesson = async () => {
    if (!subjectId || !lessonId || isCurrentLessonCompleted) return

    setIsCompleting(true)
    setError('')

    try {
      await api.post('/student/complete-lesson', {
        subjectId,
        lessonId,
      })

      markLessonCompleted(userId, subjectId, lessonId)
      setIsCurrentLessonCompleted(true)
      await openLessonQuiz()
    } catch {
      setError('No se pudo marcar esta leccion como completada.')
    } finally {
      setIsCompleting(false)
    }
  }

  const videoEmbedUrl = lesson?.videoUrl ? getYoutubeEmbedUrl(lesson.videoUrl) : null
  const isVideoLesson = lesson?.contentType === 'video' && !!lesson?.videoUrl

  return (
    <main className="app-shell overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
      </div>

      <section className="app-content space-y-6">
        <header className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-blue">Aula interactiva</p>
            <p className="glass-badge-purple">Lesson View</p>
          </div>

          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">
            {subject?.name || 'Leccion'}
          </h1>
          <p className="mt-2 text-slate-600">
            {subject?.description || 'Explora el contenido y avanza leccion a leccion.'}
          </p>
        </header>

        {loading ? <p className="glass-panel p-4 text-sm font-semibold text-slate-600">Cargando aula interactiva...</p> : null}
        {error ? <p className="glass-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-slate-900">{lesson?.title || 'Leccion'}</h2>
                <span className="glass-badge-yellow">
                  {currentLessonIndex >= 0 ? `Leccion ${currentLessonIndex + 1} de ${lessons.length}` : 'Leccion'}
                </span>
              </div>

              {isVideoLesson ? (
                <div className="space-y-4">
                  {videoEmbedUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-white/60 bg-black/80">
                      <iframe
                        title={lesson?.title || 'Video de leccion'}
                        src={videoEmbedUrl}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video controls className="w-full rounded-2xl border border-white/60 bg-black/80">
                      <source src={lesson.videoUrl} />
                      Tu navegador no soporta video embebido.
                    </video>
                  )}
                </div>
              ) : (
                <article className="space-y-4 text-slate-700">
                  {parseParagraphs(lesson?.content).map((paragraph) => (
                    <p key={paragraph.slice(0, 50)} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </article>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCompleteLesson}
                  disabled={isCurrentLessonCompleted || isCompleting}
                  className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCurrentLessonCompleted
                    ? 'Leccion completada'
                    : isCompleting
                      ? 'Guardando progreso...'
                      : 'Completar leccion'}
                </button>

                <button
                  type="button"
                  onClick={openLessonQuiz}
                  disabled={!isCurrentLessonCompleted || isQuizLoading}
                  className="glass-cta-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isQuizLoading ? 'Cargando quiz...' : 'Abrir quiz'}
                </button>

                {isCurrentLessonMastered ? (
                  <span className="glass-badge-purple">Leccion dominada</span>
                ) : isCurrentLessonCompleted ? (
                  <span className="glass-badge-blue">Puedes avanzar a la siguiente leccion</span>
                ) : (
                  <span className="text-sm font-semibold text-slate-600">
                    Completa esta leccion para desbloquear Siguiente.
                  </span>
                )}
              </div>

              {quizResult && !quizResult.mastered ? (
                <p className="mt-3 text-sm font-semibold text-amber-700">
                  Sigue intentando. Reintento disponible {retryCountdown > 0 ? `en ${retryCountdown}s` : 'ahora'}.
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-5">
                <button
                  type="button"
                  onClick={() => goToLesson(lessonIdOf(previousLesson))}
                  disabled={!previousLesson}
                  className="glass-cta-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anterior
                </button>

                {nextLesson ? (
                  <button
                    type="button"
                    onClick={() => goToLesson(lessonIdOf(nextLesson))}
                    disabled={!isCurrentLessonCompleted}
                    className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Siguiente
                  </button>
                ) : (
                  <Link to="/dashboard/student" className="glass-cta-blue">
                    Volver al dashboard
                  </Link>
                )}
              </div>
            </section>

            <aside className="glass-panel p-6">
              <h3 className="text-lg font-black text-slate-900">Progreso de la materia</h3>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>Completadas</span>
                  <span>{completedLessonsCount}/{lessons.length}</span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-100/90">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {lessons.map((item) => {
                  const itemLessonId = lessonIdOf(item)
                  const isActive = String(itemLessonId) === String(lessonId)
                  const isDone = isLessonCompleted(userId, subjectId, itemLessonId)
                  const isMastered = isLessonMastered(userId, subjectId, itemLessonId)

                  return (
                    <li key={itemLessonId}>
                      <button
                        type="button"
                        onClick={() => goToLesson(itemLessonId)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'border-brand-blue/50 bg-brand-blue/10' : 'border-white/60 bg-white/50 hover:bg-white/70'}`}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Leccion {item.position}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          {isMastered ? 'Dominada' : isDone ? 'Completada' : isActive ? 'En curso' : 'Pendiente'}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>
          </div>
        ) : null}
      </section>

      <QuizModal
        key={`${subjectId}-${lessonId}-${quizSessionId}`}
        isOpen={isQuizOpen}
        quiz={quiz}
        isSubmitting={isQuizSubmitting}
        submitError={quizSubmitError}
        result={quizResult}
        retryCountdown={retryCountdown}
        onClose={() => setIsQuizOpen(false)}
        onSubmit={handleSubmitQuiz}
        onRetry={handleRetryQuiz}
      />
    </main>
  )
}

export default LessonView
