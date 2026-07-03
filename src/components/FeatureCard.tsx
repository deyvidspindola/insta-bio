import type { ReactNode } from 'react'
import type { FeatureCard as FeatureCardType } from '../types/bio'
import { ArrowIcon, BioIcon } from './icons'

function ImageOverlay() {
  return <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
}

function BadgePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
      {children}
    </span>
  )
}

export function FeatureCard({ item }: { item: FeatureCardType }) {
  if (item.variant === 'square') {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-square overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
      >
        {item.image ? (
          <>
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                item.gradient ??
                'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
            }}
          />
        )}

        {item.badge && (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
            {item.badge}
          </span>
        )}

        <ArrowIcon className="absolute right-2 top-2 h-4 w-4 text-white/90 drop-shadow" />

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-base font-bold leading-tight text-white">{item.title}</h3>
          {item.description && <p className="mt-0.5 text-[10px] text-white/85">{item.description}</p>}
        </div>
      </a>
    )
  }

  if (item.variant === 'portrait' && item.image) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[3/4]">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <ImageOverlay />

          {item.badge && (
            <span className="absolute left-3 top-3">
              <BadgePill>{item.badge}</BadgePill>
            </span>
          )}

          <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">{item.title}</h3>
            <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
          </div>
        </div>
      </a>
    )
  }

  if (item.variant === 'banner' && item.image) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <div
            aria-hidden="true"
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.78 0.16 80 / 0.55) 0%, transparent 55%)',
            }}
          />

          {item.tags && item.tags.length > 0 && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5">
              {item.tags.map((tag) => (
                <BadgePill key={tag.label}>
                  {tag.icon && <BioIcon name={tag.icon} className="mr-1 h-3 w-3" />}
                  {tag.label}
                </BadgePill>
              ))}
            </div>
          )}

          <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.85_0.16_75)]">
                    {item.badge}
                  </span>
                )}
                <h3 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
              </div>
              {item.cta && (
                <span className="hidden shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md sm:inline-flex">
                  {item.cta}
                </span>
              )}
            </div>
            {item.cta && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md sm:hidden">
                <BioIcon name="hand-heart" className="h-3.5 w-3.5" />
                {item.cta}
              </span>
            )}
          </div>
        </div>
      </a>
    )
  }

  if (item.variant === 'compact') {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
      >
        <div
          className="relative overflow-hidden p-5"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.22 0.04 25) 0%, oklch(0.14 0.03 25) 100%)',
          }}
        >
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-[60px] shrink-0 items-center justify-center rounded-xl bg-[#FF0000] shadow-[0_8px_24px_-6px_rgba(255,0,0,0.6)] ring-1 ring-white/10">
              <BioIcon name={item.icon} className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              {item.badge && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF4D6A]">
                  {item.badge}
                </span>
              )}
              <h3 className="mt-0.5 text-lg font-bold leading-tight text-white">{item.title}</h3>
              <p className="mt-0.5 text-xs text-white/70">{item.description}</p>
            </div>
            <ArrowIcon className="h-5 w-5 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </a>
    )
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
    >
      <div
        className="relative p-5 sm:p-6"
        style={{
          background:
            item.gradient ??
            'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
        }}
      >
        <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <BioIcon name={item.icon ?? 'compass'} className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {item.badge && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
                {item.badge}
              </span>
            )}
            <h3 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
              {item.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">
              {item.description}
            </p>
            {item.cta && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-black shadow-md">
                {item.cta}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}
