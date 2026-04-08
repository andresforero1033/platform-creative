function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-shimmer ${className}`} aria-hidden="true" />
}

export function DashboardMetricCardSkeleton() {
  return (
    <article className="glass-card border-white/60 p-4">
      <SkeletonBlock className="h-3 w-28 rounded-full" />
      <SkeletonBlock className="mt-3 h-8 w-16 rounded-xl" />
      <SkeletonBlock className="mt-2 h-3 w-40 rounded-full" />
    </article>
  )
}

export function SubjectCardSkeleton() {
  return (
    <article className="glass-card border-white/60 p-5">
      <SkeletonBlock className="h-6 w-44 rounded-xl" />
      <SkeletonBlock className="mt-2 h-3 w-52 rounded-full" />
      <SkeletonBlock className="mt-1 h-3 w-48 rounded-full" />
      <SkeletonBlock className="mt-4 h-2.5 w-full rounded-full" />
      <SkeletonBlock className="mt-4 h-10 w-full rounded-2xl" />
    </article>
  )
}

function DashboardHeaderSkeleton() {
  return (
    <header className="glass-panel p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <SkeletonBlock className="h-6 w-24 rounded-full" />
        <SkeletonBlock className="h-6 w-28 rounded-full" />
      </div>
      <SkeletonBlock className="mt-4 h-10 w-80 max-w-full rounded-2xl" />
      <SkeletonBlock className="mt-3 h-4 w-96 max-w-full rounded-full" />
    </header>
  )
}

function DashboardPanelSkeleton({ cards = 3 }) {
  return (
    <article className="glass-panel p-6">
      <SkeletonBlock className="h-7 w-52 rounded-2xl" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: cards }).map((_, index) => (
          <SubjectCardSkeleton key={`panel-card-${index}`} />
        ))}
      </div>
    </article>
  )
}

export function DashboardPageSkeleton({
  metricCount = 4,
  leftCards = 3,
  rightCards = 2,
}) {
  return (
    <div className="space-y-6">
      <DashboardHeaderSkeleton />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: metricCount }).map((_, index) => (
          <DashboardMetricCardSkeleton key={`metric-skeleton-${index}`} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanelSkeleton cards={leftCards} />
        <DashboardPanelSkeleton cards={rightCards} />
      </section>
    </div>
  )
}
