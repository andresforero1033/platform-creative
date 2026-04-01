import { motion } from 'framer-motion'

const MotionDiv = motion.div

function Hero() {
  return (
    <section id="producto" className="relative overflow-hidden px-6 pb-24 pt-20">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-2 md:items-center">
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <p className="inline-flex rounded-full bg-brand-yellow/40 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
            Educacion + Tecnologia
          </p>
          <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-6xl">
            Explora, Aprende y Domina el Manana.
          </h1>
          <p className="max-w-xl text-base text-slate-700 md:text-lg">
            La plataforma educativa que se adapta a tu ritmo con inteligencia y juegos.
          </p>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative rounded-3xl border border-white/60 bg-white/70 p-8 shadow-glow"
        >
          <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-slate-800">
            <div className="rounded-2xl bg-brand-blue/15 p-4">Rutas Personalizadas</div>
            <div className="rounded-2xl bg-brand-purple/15 p-4">Feedback Docente</div>
            <div className="rounded-2xl bg-brand-yellow/30 p-4">Retos y Certificados</div>
            <div className="rounded-2xl bg-slate-100 p-4">Alertas en Tiempo Real</div>
          </div>
        </MotionDiv>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-grid bg-[size:24px_24px]" />
    </section>
  )
}

export default Hero
