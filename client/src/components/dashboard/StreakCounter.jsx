function StreakCounter({ currentStreak = 0, longestStreak = 0 }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Rachas activas</p>
      <div className="mt-3 flex items-end gap-6">
        <div>
          <p className="text-3xl font-black text-amber-900">{currentStreak}</p>
          <p className="text-xs font-medium text-amber-700">Racha actual</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-amber-800">{longestStreak}</p>
          <p className="text-xs font-medium text-amber-700">Mejor racha</p>
        </div>
      </div>
    </section>
  )
}

export default StreakCounter
