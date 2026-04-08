import { Link } from 'react-router-dom'

function IconIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 text-brand-blue" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="48" className="fill-brand-blue/10 stroke-brand-blue/40" strokeWidth="2" />
      <path d="M40 60h40M60 40v40" className="stroke-brand-purple" strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="10" className="fill-brand-yellow/70 stroke-brand-purple/40" strokeWidth="2" />
    </svg>
  )
}

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaTo,
  ctaOnClick,
}) {
  return (
    <article className="glass-panel flex flex-col items-center gap-3 px-6 py-10 text-center">
      <IconIllustration />
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="max-w-lg text-sm text-slate-600">{description}</p>

      {ctaLabel && ctaTo ? (
        <Link to={ctaTo} className="glass-cta-primary mt-2">
          {ctaLabel}
        </Link>
      ) : null}

      {ctaLabel && !ctaTo && ctaOnClick ? (
        <button type="button" className="glass-cta-primary mt-2" onClick={ctaOnClick}>
          {ctaLabel}
        </button>
      ) : null}
    </article>
  )
}

export default EmptyState
