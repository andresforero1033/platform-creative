import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

function Navbar() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="glass-nav sticky top-0 z-40">
      <nav className="app-content flex items-center justify-between py-4">
        <a
          href="#producto"
          className="group rounded-lg text-lg font-extrabold tracking-tight text-brand-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30"
        >
          Creative Platform
          <span className="mt-1 block h-0.5 w-0 rounded-full bg-brand-purple transition-all duration-300 group-hover:w-full" />
        </a>

        <div className="hidden gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="#producto" className="glass-link-blue">Producto</a>
          <a href="#beta" className="glass-link-blue">Beta</a>
          <a href="#equipo" className="glass-link-blue">Equipo</a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="glass-cta-secondary"
              >
                Mi Perfil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="glass-cta-primary"
              >
                Cerrar Sesion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="glass-cta-secondary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="glass-cta-primary"
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
