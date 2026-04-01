import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <a href="#producto" className="text-lg font-extrabold tracking-tight text-brand-purple">
          Creative Platform
        </a>

        <div className="hidden gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="#producto" className="transition hover:text-brand-blue">Producto</a>
          <a href="#equipo" className="transition hover:text-brand-blue">Equipo</a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="rounded-xl border border-brand-blue/40 px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10"
              >
                Mi Perfil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                Cerrar Sesion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-brand-blue/40 px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                Registro
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
