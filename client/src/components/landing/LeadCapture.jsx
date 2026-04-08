import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'

const MotionSection = motion.section
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LeadCapture() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  const validateEmail = (value) => EMAIL_REGEX.test(value)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateEmail(normalizedEmail)) {
      setFeedback({
        type: 'error',
        message: 'Ingresa un email valido para continuar.',
      })
      return
    }

    setLoading(true)
    setFeedback({ type: '', message: '' })

    try {
      const response = await api.post('/public/leads', {
        email: normalizedEmail,
        source: 'landing',
      })

      const message = response?.data?.message || 'Solicitud recibida. Te contactaremos pronto.'
      setFeedback({ type: 'success', message })
      setEmail('')
    } catch (error) {
      const validationMessage = error?.response?.data?.data?.[0]?.msg
      const backendMessage = error?.response?.data?.message
      const networkMessage = error?.message === 'Network Error'
        ? 'No hay conexion con el backend.'
        : ''

      setFeedback({
        type: 'error',
        message: validationMessage || backendMessage || networkMessage || 'No pudimos enviar tu solicitud.',
      })
    } finally {
      setLoading(false)
    }
  }

  const feedbackClass = feedback.type === 'success'
    ? 'border-brand-blue/25 bg-brand-blue/10 text-brand-blue'
    : 'border-red-200/80 bg-red-50/85 text-red-700'

  return (
    <section id="beta" className="mb-20">
      <div className="app-content">
        <MotionSection
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
          className="glass-panel relative overflow-hidden rounded-[2.5rem] border border-brand-purple/20 p-10 text-center md:p-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-purple/15 via-brand-blue/10 to-transparent" />
          <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-brand-blue/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-brand-yellow/20 blur-3xl" />

          <p className="glass-badge-purple relative z-10">Beta Cerrada</p>
          <h2 className="relative z-10 mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Listo para revolucionar
            <br />
            tu ecosistema educativo?
          </h2>
          <p className="relative z-10 mx-auto mt-5 mb-10 max-w-xl text-slate-700">
            Unete a la beta cerrada. Deja tu correo y te contactaremos para configurar tu entorno de pruebas sin costo.
          </p>

          <form className="relative z-10 mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              required
              className="glass-input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="glass-cta-primary inline-flex min-w-[170px] items-center justify-center disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Enviando...
                </span>
              ) : (
                'Solicitar Acceso'
              )}
            </button>
          </form>

          {feedback.message ? (
            <p className={`relative z-10 mx-auto mt-4 max-w-md rounded-xl border px-4 py-2 text-sm font-semibold backdrop-blur ${feedbackClass}`}>
              {feedback.message}
            </p>
          ) : null}
        </MotionSection>
      </div>
    </section>
  )
}

export default LeadCapture
