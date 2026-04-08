function DashboardMetricCard({ label, value, description, tone = 'blue' }) {
  const toneClasses = {
    blue: 'border-brand-blue/25',
    purple: 'border-brand-purple/25',
    yellow: 'border-brand-yellow/35',
  }

  return (
    <article className={`glass-card p-4 ${toneClasses[tone] || toneClasses.blue}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </article>
  )
}

export default DashboardMetricCard
