import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

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
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">Crea tu cuenta para comenzar tu recorrido de aprendizaje.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-700">Nombre</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              type="text"
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />
            {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
            {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-semibold text-slate-700">Rol</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              {AVAILABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            {fieldErrors.role ? <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p> : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              type="password"
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              required
            />
            {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold text-slate-700">Confirmar password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              type="password"
              placeholder="Repite tu password"
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p> : null}
          </div>

          {submitError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-purple px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand-blue">Inicia sesion</Link>
        </p>
      </section>
    </main>
  )
}

export default Register
