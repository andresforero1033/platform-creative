import { motion } from 'framer-motion'

function SubjectCard({ subject, mastery = 0, index = 0 }) {
  const masterySafe = Math.max(0, Math.min(100, Math.round(mastery)))

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{subject.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{subject.description || 'Ruta de aprendizaje disponible.'}</p>
        </div>
        <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-sm font-semibold text-brand-blue">
          {masterySafe}%
        </span>
      </div>

      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple"
          style={{ width: `${masterySafe}%` }}
        />
      </div>
    </motion.article>
  )
}

export default SubjectCard
