import type { ReactNode } from 'react'
import type { FeatureCard as FeatureCardType } from '../types/bio'
import {
  CardLink,
  isCardInteractive,
  resolveCopyText,
  useCardAction,
} from '../lib/cardLink'
import { resolveCardSurface } from '../lib/colorEngine'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { BioIcon } from './icons'
import { CardActionIcon } from './CardActionIcon'
import { CardCoverImage } from './CardCoverImage'

const FALLBACK_GRADIENT = APP_HERO_PRESETS.custom.theme.gradient

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

function CtaLabel({ label }: { label: string }) {
  const { copied } = useCardAction()
  return <>{copied ? 'Copiado!' : label}</>
}

export function FeatureCard({
  item,
  grid = false,
  pageBackground = '#000000',
}: {
  item: FeatureCardType
  grid?: boolean
  pageBackground?: string
}) {
  const interactive = isCardInteractive(item.action, item.url, item.cta, item.pageSlug)
  const copyText = resolveCopyText(item.cta, item.url)
  const shellClass = `bio-card bio-card--media group relative block ${grid ? 'h-full' : ''}`
  const hasImage = Boolean(item.image?.trim())
  // Variantes com imagem/overlay forte ou compact (fundo já escuro) mantêm texto branco.
  const useSurface =
    !hasImage && item.variant !== 'compact' && item.variant !== 'portrait' && item.variant !== 'banner'
  const surface = useSurface
    ? resolveCardSurface(item.gradient ?? FALLBACK_GRADIENT, pageBackground)
    : null
  const titleColor = surface?.titleText ?? '#FFFFFF'
  const bodyColor = surface?.bodyText ?? 'rgba(255,255,255,0.85)'
  const mutedColor = surface?.bodyText ?? 'rgba(255,255,255,0.8)'

  const linkProps = {
    url: item.url,
    action: item.action,
    pageSlug: item.pageSlug,
    copyText,
  }

  if (item.variant === 'square') {
    return (
      <CardLink {...linkProps} className={`${shellClass} aspect-square`}>
        <CardCoverImage
          src={item.image}
          alt={item.title}
          gradient={item.gradient}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {hasImage ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        ) : null}

        {item.badge && (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
            {item.badge}
          </span>
        )}

        {interactive && (
          <span className="absolute right-2 top-2 text-white/90 drop-shadow">
            <CardActionIcon className="h-4 w-4" />
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-base font-bold leading-tight" style={{ color: titleColor }}>
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-0.5 text-[10px]" style={{ color: bodyColor }}>
              {item.description}
            </p>
          )}
        </div>
      </CardLink>
    )
  }

  if (item.variant === 'portrait') {
    const showText = item.showTitleOnMedia !== false
    const hasOverlayText =
      showText &&
      Boolean(
        (item.badge && item.tags && item.tags.length > 0) ||
          item.title.trim() ||
          item.description?.trim(),
      )

    return (
      <CardLink {...linkProps} className={shellClass}>
        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[3/4]">
          <CardCoverImage
            src={item.image}
            alt={item.title.trim() || 'Card'}
            gradient={item.gradient}
            fallbackSize="lg"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          {showText ? <ImageOverlay /> : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="absolute left-3 top-3 inline-flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
                <BadgePill key={tag.label}>
                  {tag.icon && <BioIcon name={tag.icon} className="mr-1 h-3 w-3" />}
                  {tag.label}
                </BadgePill>
              ))}
            </div>
          )}

          {item.badge && !(item.tags && item.tags.length > 0) && (
            <span className="absolute left-3 top-3">
              <BadgePill>{item.badge}</BadgePill>
            </span>
          )}

          {interactive && (
            <span className="absolute right-3 top-3 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <CardActionIcon className="h-5 w-5" />
            </span>
          )}

          {hasOverlayText && (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              {item.badge && item.tags && item.tags.length > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.85_0.16_75)]">
                  {item.badge}
                </span>
              )}
              {item.title.trim() && (
                <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">
                  {item.title}
                </h3>
              )}
              {item.description?.trim() && (
                <p
                  className={`text-xs text-white/85 sm:text-sm ${item.title.trim() ? 'mt-1' : ''}`}
                >
                  {item.description}
                </p>
              )}
            </div>
          )}
        </div>
      </CardLink>
    )
  }

  if (item.variant === 'banner') {
    const showText = item.showTitleOnMedia !== false

    return (
      <CardLink {...linkProps} className={shellClass}>
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <CardCoverImage
            src={item.image}
            alt={item.title.trim() || 'Card'}
            gradient={item.gradient}
            fallbackSize="lg"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          {showText ? (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          )}
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

          {interactive && (
            <span className="absolute right-3 top-3 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <CardActionIcon className="h-5 w-5" />
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                {showText && item.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.85_0.16_75)]">
                    {item.badge}
                  </span>
                )}
                {showText && item.title.trim() && (
                  <h3 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                    {item.title}
                  </h3>
                )}
                {showText && item.description?.trim() && (
                  <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
                )}
              </div>
              {item.cta && (
                <span className="hidden shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md sm:inline-flex">
                  <CtaLabel label={item.cta} />
                </span>
              )}
            </div>
            {item.cta && (
              <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md sm:hidden">
                <CtaLabel label={item.cta} />
              </span>
            )}
          </div>
        </div>
      </CardLink>
    )
  }

  if (item.variant === 'compact') {
    return (
      <CardLink {...linkProps} className={`${shellClass} h-full`}>
        <div
          className="relative overflow-hidden p-4 sm:p-5"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.22 0.04 25) 0%, oklch(0.14 0.03 25) 100%)',
          }}
        >
          <div className="relative flex items-center gap-3 sm:gap-4">
            {item.icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF0000] shadow-[0_8px_24px_-6px_rgba(255,0,0,0.6)] ring-1 ring-white/10 sm:h-14 sm:w-[60px]">
                <BioIcon name={item.icon} className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {item.badge && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF4D6A]">
                  {item.badge}
                </span>
              )}
              <h3 className="mt-0.5 text-base font-bold leading-tight text-white sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-white/70 sm:text-xs">{item.description}</p>
            </div>
            {interactive && (
              <span className="shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <CardActionIcon className="h-5 w-5" />
              </span>
            )}
          </div>
        </div>
      </CardLink>
    )
  }

  const centered = item.align === 'center'

  return (
    <CardLink {...linkProps} className={shellClass}>
      <div
        className="relative p-5 sm:p-6"
        style={{
          background: surface?.background ?? item.gradient ?? FALLBACK_GRADIENT,
        }}
      >
        {interactive && !item.cta && (
          <span
            className="absolute right-3 top-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: mutedColor }}
          >
            <CardActionIcon className="h-5 w-5" />
          </span>
        )}
        <div
          className={
            centered
              ? 'relative z-10 flex flex-col items-center text-center'
              : 'relative z-10 flex items-center gap-4'
          }
        >
          {item.icon && (
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm ${
                centered ? 'mb-3' : ''
              }`}
            >
              <BioIcon name={item.icon} className="h-7 w-7 text-white" />
            </div>
          )}
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            {item.badge && (
              <span
                className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: mutedColor }}
              >
                {item.badge}
              </span>
            )}
            <h3
              className="mt-1 text-xl font-bold leading-tight sm:text-2xl"
              style={{ color: titleColor }}
            >
              {item.title}
            </h3>
            <p
              className="mt-1.5 text-xs leading-relaxed sm:text-sm"
              style={{ color: bodyColor }}
            >
              {item.description}
            </p>
            {item.cta && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-black shadow-md">
                <CtaLabel label={item.cta} />
                <CardActionIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </CardLink>
  )
}
