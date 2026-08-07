import type { BioTemplate } from '@bio-types'
import { resolveBackgroundPreset } from '@site/lib/backgroundPresets'
import { resolveCardRadiusPx } from '@site/lib/cardRadius'
import {
  getPackCapabilityLabels,
  getPackPreviewLabels,
  type ThemePack,
} from '@site/lib/themePacks'
import { resolvePublicUrl } from '@site/lib/publicUrl'

import type { CSSProperties } from 'react'

function MockLink({
  template,
  primary,
  radius,
  label,
}: {
  template: BioTemplate
  primary: string
  radius: string
  label: string
}) {
  const base: CSSProperties = {
    borderRadius: template === 'pill' ? '9999px' : radius,
    width: '100%',
    minHeight: 20,
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 7,
    fontWeight: 600,
    letterSpacing: '0.01em',
    boxSizing: 'border-box',
  }

  const iconDot = (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: 3,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.22)',
      }}
    />
  )

  if (template === 'pill' || template === 'solid') {
    return (
      <div
        style={{
          ...base,
          background:
            template === 'solid'
              ? `linear-gradient(135deg, color-mix(in oklch, ${primary} 92%, white), color-mix(in oklch, ${primary} 78%, black))`
              : primary,
          color: '#fff',
          border: 'none',
        }}
      >
        {iconDot}
        <span className="truncate">{label}</span>
      </div>
    )
  }

  if (template === 'outline') {
    return (
      <div
        style={{
          ...base,
          background: 'rgba(0,0,0,0.2)',
          border: `1.5px solid ${primary}`,
          color: '#fff',
        }}
      >
        {iconDot}
        <span className="truncate" style={{ color: primary }}>
          {label}
        </span>
      </div>
    )
  }

  if (template === 'glass') {
    return (
      <div
        style={{
          ...base,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.28)',
          color: '#fff',
          backdropFilter: 'blur(6px)',
        }}
      >
        {iconDot}
        <span className="truncate">{label}</span>
      </div>
    )
  }

  if (template === 'soft') {
    return (
      <div
        style={{
          ...base,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.14)',
          color: '#fff',
          boxShadow: '0 6px 14px -8px rgba(0,0,0,0.55)',
        }}
      >
        {iconDot}
        <span className="truncate">{label}</span>
      </div>
    )
  }

  return (
    <div
      style={{
        ...base,
        background: 'rgba(0,0,0,0.38)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#fff',
      }}
    >
      {iconDot}
      <span className="truncate">{label}</span>
    </div>
  )
}

function resolvePackPreviewBackground(pack: ThemePack): string {
  const theme = pack.snapshot.theme
  if (theme.backgroundImage) {
    const url = resolvePublicUrl(theme.backgroundImage)
    const overlay = Math.round((theme.backgroundOverlayOpacity ?? 0.55) * 100)
    return `linear-gradient(rgba(0,0,0,${overlay / 100}), rgba(0,0,0,${overlay / 100})), url(${url}) center/cover`
  }
  const preset = resolveBackgroundPreset(theme.backgroundPreset)
  return preset?.gradient ?? theme.background ?? '#0a0a0a'
}

/** Card de template pronto — mini bio fiel ao layout público. */
export function TemplateCard({
  pack,
  active,
  brandName,
  logoUrl,
  applyLabel = 'Usar esta bio',
  onApply,
}: {
  pack: ThemePack
  active: boolean
  brandName?: string
  logoUrl?: string
  applyLabel?: string
  onApply: () => void
}) {
  const theme = pack.snapshot.theme
  const bg = resolvePackPreviewBackground(pack)
  const primary = theme.primary
  const glow = theme.glow ?? primary
  const radius = resolveCardRadiusPx(theme.cardRadius)
  const template = pack.snapshot.template
  const name = brandName?.trim() || 'Sua marca'
  const logo = logoUrl?.trim() ? resolvePublicUrl(logoUrl) : null
  const tagline = pack.snapshot.brand?.tagline
  const socialCount = Math.min(pack.snapshot.brand?.socialLinks?.length ?? 0, 4)
  const linkLabels = getPackPreviewLabels(pack).slice(0, 3)
  const caps = getPackCapabilityLabels(pack)

  return (
    <article
      className={`template-card flex h-full w-full flex-col overflow-hidden rounded-xl border text-left transition-shadow ${
        active
          ? 'border-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_45%,transparent),0_0_24px_-6px_color-mix(in_oklch,var(--color-primary)_55%,transparent)]'
          : 'border-border bg-background/40'
      }`}
    >
      <div
        className="relative h-[220px] shrink-0 overflow-hidden px-3 pb-3 pt-7"
        style={{ background: bg, backgroundSize: 'cover' }}
      >
        {active ? (
          <span className="absolute left-2 top-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
            Em uso
          </span>
        ) : (
          <span className="absolute left-2 top-2 z-10 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90">
            {pack.niche}
          </span>
        )}

        <div className="relative flex h-full flex-col items-center text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-4 -top-2 h-16 rounded-full opacity-60 blur-2xl"
            style={{
              background: `radial-gradient(ellipse at center, ${glow}, transparent 70%)`,
            }}
          />

          {logo ? (
            <img
              src={logo}
              alt=""
              className="relative size-9 shrink-0 rounded-2xl object-cover shadow-lg ring-1 ring-white/15"
            />
          ) : (
            <span
              className="relative flex size-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg ring-1 ring-white/15"
              style={{ background: primary }}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}

          <p className="relative mt-1 max-w-full truncate text-[10px] font-bold text-white drop-shadow">
            {name}
          </p>
          <p className="relative mt-0.5 line-clamp-1 min-h-[10px] max-w-[95%] text-[7px] leading-snug text-white/75">
            {tagline || '\u00a0'}
          </p>

          <div className="relative mt-1.5 flex min-h-3.5 gap-1">
            {socialCount > 0
              ? Array.from({ length: socialCount }).map((_, i) => (
                  <span
                    key={i}
                    className="size-3.5 rounded-full border border-white/25 bg-white/10"
                  />
                ))
              : null}
          </div>

          <div className="relative mt-auto w-full space-y-1 pb-0.5">
            {linkLabels.map((label, index) => (
              <MockLink
                key={`${index}-${label}`}
                template={template}
                primary={primary}
                radius={radius}
                label={label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="min-h-[3.25rem]">
          <p className="truncate text-xs font-semibold">{pack.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {pack.description}
          </p>
        </div>

        <div className="mt-2 flex min-h-[1.25rem] flex-wrap gap-1">
          {caps.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
            >
              {cap}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-3">
          <div className="flex gap-1.5">
            {[theme.primary, theme.secondary, theme.glow].map((color, i) => (
              <span
                key={i}
                className="size-3.5 rounded-full border border-border"
                style={{ background: color || '#888' }}
              />
            ))}
          </div>
          <button
            type="button"
            className={`w-full py-1.5 text-xs ${active ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onApply}
            disabled={active}
          >
            {active ? 'Template ativo' : applyLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
