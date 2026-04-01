import { Link } from 'react-router-dom'

function Register() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">Formulario base para registro conectado al backend.</p>

        <form className="mt-8 space-y-4">
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="text" placeholder="Nombre" />
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="email" placeholder="Email" />
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="password" placeholder="Password" />
          <button type="button" className="w-full rounded-xl bg-edu-violet px-4 py-3 font-semibold text-white">
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Ya tienes cuenta? <Link to="/login" className="font-semibold text-edu-blue">Inicia sesion</Link>
        </p>
      </section>
    </main>
  )
}

export default Register
