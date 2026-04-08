function StreakCounter({ currentStreak = 0, longestStreak = 0 }) {
  return (
    <section className="glass-card relative overflow-hidden border-brand-yellow/35 p-5">
      <div className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rounded-full bg-brand-yellow/25 blur-2xl" />

      <p className="glass-badge-yellow">Rachas activas</p>
      <div className="mt-4 flex items-end gap-8">
        <div className="min-w-[110px]">
          <p className="text-3xl font-black text-amber-900">{currentStreak}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Racha actual</p>
        </div>
        <div className="min-w-[110px]">
          <p className="text-2xl font-extrabold text-amber-800">{longestStreak}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Mejor racha</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-amber-100/80">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-yellow to-brand-purple" />
      </div>
    </section>
  )
}

export default StreakCounter
