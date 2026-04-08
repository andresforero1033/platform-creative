import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'

const MotionSection = motion.section

const AVAILABLE_ROLES = [
  { value: 'student', label: 'Estudiante' },
  { value: 'parent', label: 'Padre/Madre' },
  { value: 'teacher', label: 'Docente' },
]

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidPassword = useMemo(() => form.password.length >= 8, [form.password])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: '' }))
    setSubmitError('')
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.'
    if (!form.email.trim()) nextErrors.email = 'El email es obligatorio.'
    if (!form.password) nextErrors.password = 'La password es obligatoria.'
    if (!isValidPassword) nextErrors.password = 'Usa al menos 8 caracteres.'
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Las passwords no coinciden.'
    }
    if (!AVAILABLE_ROLES.some((role) => role.value === form.role)) {
      nextErrors.role = 'Selecciona un rol valido.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const { dashboardPath } = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })

      navigate(dashboardPath, { replace: true })
    } catch (error) {
      const validationError = error?.response?.data?.data?.[0]?.msg
      const backendMessage = error?.response?.data?.message
      const networkMessage = error?.message === 'Network Error'
        ? 'No hay conexion con el backend. Verifica que API este en puerto 10000.'
        : ''

      setSubmitError(validationError || backendMessage || networkMessage || 'No se pudo completar el registro.')
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
        <p className="glass-badge-blue">Nuevo Usuario</p>
        <h1 className="mt-4 text-3xl font-black text-slate-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">Crea tu cuenta para comenzar tu recorrido de aprendizaje.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="glass-input-label">Nombre</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="glass-input"
              type="text"
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />
            {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="glass-input-label">Email</label>
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
            {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="role" className="glass-input-label">Rol</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="glass-select"
            >
              {AVAILABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            {fieldErrors.role ? <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p> : null}
          </div>

          <div>
            <label htmlFor="password" className="glass-input-label">Password</label>
            <input
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="glass-input"
              type="password"
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              required
            />
            {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="glass-input-label">Confirmar password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="glass-input"
              type="password"
              placeholder="Repite tu password"
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p> : null}
          </div>

          {submitError ? (
            <p className="glass-error">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="glass-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="glass-link-blue">Inicia sesion</Link>
        </p>
      </MotionSection>
    </main>
  )
}

export default Register
