import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'

const MotionSection = motion.section

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSubmitting(true)

    try {
      const { dashboardPath } = await login(form)
      navigate(dashboardPath, { replace: true })
    } catch (error) {
      const statusCode = error?.response?.status
      const backendMessage = error?.response?.data?.message

      if (statusCode === 401) {
        setErrorMessage('Credenciales incorrectas.')
      } else {
        setErrorMessage(backendMessage || 'No se pudo iniciar sesion. Intenta nuevamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-glow-blue" />
      <div className="auth-glow-purple" />
      <div className="auth-glow-yellow" />

      <MotionSection
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-panel w-full max-w-md p-8"
      >
        <p className="glass-badge-purple">Acceso Seguro</p>
        <h1 className="mt-4 text-3xl font-black text-slate-900">Iniciar sesion</h1>
        <p className="mt-2 text-sm text-slate-600">Accede para continuar tu experiencia educativa personalizada.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="glass-input-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="glass-input"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="glass-input-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="glass-input"
              type="password"
              placeholder="Tu password"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage ? (
            <p className="glass-error">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="glass-cta-blue w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Aun no tienes cuenta?{' '}
          <Link to="/register" className="glass-link-purple">Crear cuenta</Link>
        </p>
      </MotionSection>
    </main>
  )
}

export default Login
