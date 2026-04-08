import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const MotionDiv = motion.div
const MotionSection = motion.section
const MotionArticle = motion.article
const MotionSpan = motion.span

function SuccessConfetti() {
  const pieces = useMemo(
    () => Array.from({ length: 24 }, (_, index) => ({
      id: index,
      left: `${(index * 17) % 100}%`,
      delay: (index % 6) * 0.08,
      colorClass: index % 3 === 0 ? 'bg-brand-blue' : index % 3 === 1 ? 'bg-brand-purple' : 'bg-brand-yellow',
      rotate: (index * 29) % 360,
    })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <MotionSpan
          key={piece.id}
          initial={{ y: -20, opacity: 0, rotate: piece.rotate }}
          animate={{ y: 260, opacity: [0, 1, 1, 0], rotate: piece.rotate + 140 }}
          transition={{ duration: 1.4, delay: piece.delay, repeat: Infinity, repeatDelay: 1.2 }}
          className={`absolute top-0 h-2 w-2 rounded-sm ${piece.colorClass}`}
          style={{ left: piece.left }}
        />
      ))}
    </div>
  )
}

function QuizModal({
  isOpen,
  quiz,
  isSubmitting,
  submitError,
  result,
  retryCountdown,
  onClose,
  onSubmit,
  onRetry,
}) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : []
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})

  const currentQuestion = questions[currentQuestionIndex]

  const totalQuestions = questions.length
  const answeredCount = Object.keys(selectedAnswers).length
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions

  const selectOption = (questionId, selectedOption) => {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: selectedOption,
    }))
  }

  const handleSubmit = async () => {
    if (!allAnswered || typeof onSubmit !== 'function') return

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOption: selectedAnswers[question.id],
    }))

    await onSubmit(answers)
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
        >
          <MotionSection
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className="glass-panel relative w-full max-w-3xl overflow-hidden p-6 md:p-8"
          >
            {result?.mastered ? <SuccessConfetti /> : null}

            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="glass-badge-purple">Quiz interactivo</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{quiz?.title || 'Quiz de leccion'}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-cta-secondary"
                >
                  Cerrar
                </button>
              </div>

              {result ? (
                <article className="glass-card border-brand-blue/25 p-5">
                  {result.mastered ? (
                    <>
                      <p className="text-xl font-black text-brand-blue">Dominio logrado</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Puntaje: <span className="font-bold">{result.score}%</span>. Ya puedes avanzar con seguridad.
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Badge obtenido: <span className="text-brand-purple">{result?.earnedBadge?.nombre || 'Leccion dominada'}</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-black text-amber-700">Sigue intentando</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Puntaje: <span className="font-bold">{result.score}%</span>. Revisa la leccion y vuelve a intentarlo.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="glass-cta-secondary"
                        >
                          Volver a repasar
                        </button>
                        <button
                          type="button"
                          onClick={onRetry}
                          disabled={retryCountdown > 0}
                          className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {retryCountdown > 0 ? `Reintentar en ${retryCountdown}s` : 'Reintentar quiz'}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-600">
                      Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Passing score {quiz?.passingScore ?? 70}%
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    <MotionArticle
                      key={currentQuestion?.id || currentQuestionIndex}
                      initial={{ opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.22 }}
                      className="glass-card border-brand-purple/20 p-5"
                    >
                      <h3 className="text-lg font-black text-slate-900">{currentQuestion?.prompt}</h3>

                      <div className="mt-4 space-y-2">
                        {(currentQuestion?.options || []).map((option, optionIndex) => {
                          const questionId = currentQuestion?.id
                          const isSelected = selectedAnswers[questionId] === optionIndex

                          return (
                            <button
                              key={`${questionId}-${optionIndex}`}
                              type="button"
                              onClick={() => selectOption(questionId, optionIndex)}
                              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${isSelected ? 'border-brand-blue/50 bg-brand-blue/10 text-brand-blue' : 'border-white/70 bg-white/70 text-slate-700 hover:bg-white/85'}`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    </MotionArticle>
                  </AnimatePresence>

                  {submitError ? <p className="glass-error mt-4">{submitError}</p> : null}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0 || isSubmitting}
                      className="glass-cta-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Anterior
                    </button>

                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                        disabled={isSubmitting}
                        className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Siguiente pregunta
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!allAnswered || isSubmitting}
                        className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? 'Evaluando...' : 'Enviar quiz'}
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Respuestas: {answeredCount}/{totalQuestions}
                  </p>
                </>
              )}
            </div>
          </MotionSection>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  )
}

export default QuizModal
