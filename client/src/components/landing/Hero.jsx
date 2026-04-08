import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div
const MotionArticle = motion.article

function Hero() {
  return (
    <section id="producto" className="relative isolate overflow-hidden pb-24 pt-16 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="absolute -right-16 top-24 h-80 w-80 rounded-full bg-brand-purple/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-brand-yellow/25 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-grid bg-[size:22px_22px] opacity-70" />

      <div className="app-content grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-7"
        >
          <p className="glass-badge-yellow">
            Plataforma Creativa
          </p>

          <h1 className="text-4xl font-black leading-[1.05] text-slate-900 md:text-6xl">
            Aprende con un layout que muestra tu progreso en tiempo real.
          </h1>

          <p className="max-w-xl text-base text-slate-700 md:text-lg">
            Rutas adaptativas, seguimiento de maestria y gamificacion en una experiencia clara, rapida y visual.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="glass-cta-primary"
            >
              Comenzar ahora
            </Link>
            <Link
              to="/login"
              className="glass-cta-secondary"
            >
              Ver mi panel
            </Link>
          </div>

          <div className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="glass-card border-brand-blue/25 p-3">
              <p className="text-xl font-black text-brand-blue">+30%</p>
              <p className="text-xs font-semibold text-slate-600">Retencion promedio</p>
            </div>
            <div className="glass-card border-brand-purple/25 p-3">
              <p className="text-xl font-black text-brand-purple">24/7</p>
              <p className="text-xs font-semibold text-slate-600">Feedback visible</p>
            </div>
            <div className="glass-card col-span-2 border-brand-yellow/35 p-3 sm:col-span-1">
              <p className="text-xl font-black text-amber-600">100%</p>
              <p className="text-xs font-semibold text-slate-600">Camino medible</p>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="grid auto-rows-[130px] grid-cols-2 gap-4"
        >
          <MotionArticle
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="glass-card group col-span-2 row-span-2 border-brand-purple/25 p-6 hover:shadow-glow"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-purple/25 blur-2xl" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple">Bento Core</p>
            <h3 className="mt-3 text-2xl font-black text-slate-900">Ruta adaptativa por materia</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-700">
              Cada estudiante ve primero lo que mas impacta en su progreso y maestria semanal.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-brand-purple transition group-hover:translate-x-1">
              Ver detalle del plan <span aria-hidden="true">-&gt;</span>
            </div>
          </MotionArticle>

          <MotionArticle
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.45 }}
            className="glass-card group border-brand-blue/25 p-5 hover:border-brand-blue/45"
          >
            <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-brand-blue/25 blur-xl" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Panel</p>
            <h3 className="mt-2 text-lg font-black text-slate-900">Progreso vivo</h3>
            <p className="mt-2 text-sm text-slate-700">Avance por leccion y maestria visible al instante.</p>
          </MotionArticle>

          <MotionArticle
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
            className="glass-card group border-brand-yellow/40 p-5 hover:border-brand-yellow/60"
          >
            <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-brand-yellow/30 blur-xl" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Rachas</p>
            <h3 className="mt-2 text-lg font-black text-slate-900">Habitos fuertes</h3>
            <p className="mt-2 text-sm text-slate-700">Gamificacion real con puntos, badges y motivacion diaria.</p>
          </MotionArticle>
        </MotionDiv>
      </div>
    </section>
  )
}

export default Hero
