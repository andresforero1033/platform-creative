import { motion } from 'framer-motion'

const MotionArticle = motion.article

function SubjectCard({ subject, mastery = 0, index = 0, onOpenLesson }) {
  const masterySafe = Math.max(0, Math.min(100, Math.round(mastery)))
  const hasLessons = Array.isArray(subject?.lessons) && subject.lessons.length > 0

  const handleOpenLesson = () => {
    if (typeof onOpenLesson === 'function' && hasLessons) {
      onOpenLesson(subject)
    }
  }

  return (
    <MotionArticle
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="glass-card group border-brand-blue/20 p-5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-blue/20 blur-2xl transition duration-300 group-hover:bg-brand-purple/20" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">{subject.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{subject.description || 'Ruta de aprendizaje disponible.'}</p>
        </div>
        <span className="glass-badge-blue text-[11px]">
          {masterySafe}%
        </span>
      </div>

      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100/90">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple"
          style={{ width: `${masterySafe}%` }}
        />
      </div>

      <button
        type="button"
        onClick={handleOpenLesson}
        disabled={!hasLessons}
        className="glass-cta-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {hasLessons ? 'Continuar aprendizaje' : 'Sin lecciones disponibles'}
      </button>
    </MotionArticle>
  )
}

export default SubjectCard
