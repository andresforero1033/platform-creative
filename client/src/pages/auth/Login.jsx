import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

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
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-900">Iniciar sesion</h1>
        <p className="mt-2 text-sm text-slate-600">Accede para continuar tu experiencia educativa personalizada.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email">Email</label>
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              type="password"
              placeholder="Tu password"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-blue px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Aun no tienes cuenta? <Link to="/register" className="font-semibold text-brand-purple">Crear cuenta</Link>
        </p>
      </section>
    </main>
  )
}

export default Login
