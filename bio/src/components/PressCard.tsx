import type { ReactNode } from 'react'
import type { FeatureCardAlign, PressCard as PressCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { resolveAppHeroTheme, type ResolvedAppHeroTheme } from '../lib/appHeroContrast'
import { buildPressTheme } from '../lib/pressTheme'
import { ArrowIcon, BioIcon } from './icons'
import { CardCoverImage } from './CardCoverImage'

function resolveLayout(item: PressCardType, grid: boolean) {
  if (item.layout === 'condensed') return 'condensed'
  if (grid || item.layout === 'compact') return 'compact'
  return item.layout ?? 'default'
}

function resolveAlign(item: PressCardType): FeatureCardAlign {
  return item.align === 'center' ? 'center' : 'side'
}

function PressShell({
  item,
  theme,
  children,
  className = '',
}: {
  item: PressCardType
  theme: ResolvedAppHeroTheme
  children: ReactNode
  className?: string
}) {
  const clickable = hasClickableUrl(item.url)

  return (
    <CardLink
      url={item.url}
      className={`bio-card bio-card--hero bio-card--press bio-card--media group relative block overflow-hidden border transition-all ${className} ${clickable ? '' : 'cursor-default'}`}
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => {
        if (!clickable) return
        e.currentTarget.style.borderColor = theme.borderHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
      }}
    >
      {children}
    </CardLink>
  )
}

function PressIconBox({ theme, size = 'md' }: { theme: ResolvedAppHeroTheme; size?: 'md' | 'sm' | 'xs' }) {
  const box =
    size === 'xs'
      ? 'h-9 w-9 rounded-lg'
      : size === 'sm'
        ? 'h-10 w-10 rounded-xl'
        : 'h-14 w-14 rounded-2xl'
  const iconSize = size === 'xs' ? 'h-4 w-4' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  return (
    <div
      className={`flex shrink-0 ${box} items-center justify-center ring-1`}
      style={{
        background: theme.iconBg,
        boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
      }}
    >
      <span style={{ color: theme.iconColor }}>
        <BioIcon name="newspaper" className={iconSize} />
      </span>
    </div>
  )
}

function PressDefault({
  item,
  theme,
  align,
}: {
  item: PressCardType
  theme: ResolvedAppHeroTheme
  align: FeatureCardAlign
}) {
  const centered = align === 'center'
  const cta = item.cta?.trim() || 'Ler matéria'
  const hasImage = Boolean(item.image?.trim())

  return (
    <PressShell item={item} theme={theme}>
      <div className="relative min-h-[140px] overflow-hidden">
        {hasImage ? (
          <>
            <CardCoverImage
              src={item.image}
              alt={item.title}
              gradient={theme.gradient}
              icon="newspaper"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: theme.gradient }} />
        )}

        <div
          className={`relative z-10 p-5 sm:p-6 ${
            centered ? 'flex flex-col items-center text-center' : 'flex items-center gap-4'
          }`}
        >
          <div className={centered ? 'mb-3' : ''}>
            <PressIconBox theme={theme} size="md" />
          </div>
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            <span
              className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: hasImage ? 'rgba(255,255,255,0.85)' : theme.badgeText }}
            >
              {item.source}
            </span>
            <h3
              className="mt-1 text-xl font-bold leading-tight"
              style={{ color: hasImage ? '#FFFFFF' : theme.titleText }}
            >
              {item.title}
            </h3>
            {item.description && (
              <p
                className="mt-1.5 text-xs leading-relaxed sm:text-sm"
                style={{ color: hasImage ? 'rgba(255,255,255,0.85)' : theme.bodyText }}
              >
                {item.description}
              </p>
            )}
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all group-hover:gap-2.5"
              style={{
                background: theme.ctaBg,
                color: theme.ctaText,
                boxShadow: theme.ctaShadow,
              }}
            >
              {cta}
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </PressShell>
  )
}

function PressCompact({
  item,
  theme,
  align,
}: {
  item: PressCardType
  theme: ResolvedAppHeroTheme
  align: FeatureCardAlign
}) {
  const centered = align === 'center'
  const cta = item.cta?.trim() || 'Ler'

  return (
    <PressShell item={item} theme={theme} className="h-full">
      <div
        className={`relative flex h-full min-h-[132px] p-3.5 ${
          centered ? 'flex-col items-center text-center' : 'flex-row items-center gap-3'
        }`}
        style={{ background: theme.gradient }}
      >
        <PressIconBox theme={theme} size="sm" />
        <div
          className={`flex min-w-0 flex-1 flex-col ${centered ? 'mt-2 w-full items-center' : ''}`}
        >
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.badgeText }}
          >
            {item.source}
          </span>
          <h3
            className="mt-0.5 line-clamp-2 flex-1 text-sm font-bold leading-snug"
            style={{ color: theme.titleText }}
          >
            {item.title}
          </h3>
          <span
            className={`mt-2 inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              centered ? '' : 'w-fit'
            }`}
            style={{
              background: theme.ctaBg,
              color: theme.ctaText,
              boxShadow: theme.ctaShadow,
            }}
          >
            <span className="truncate">{cta}</span>
            <ArrowIcon className="h-3 w-3 shrink-0" />
          </span>
        </div>
      </div>
    </PressShell>
  )
}

function PressCondensed({
  item,
  theme,
  align,
}: {
  item: PressCardType
  theme: ResolvedAppHeroTheme
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <PressShell item={item} theme={theme} className="h-full">
      <div
        className={`flex h-full min-h-[72px] p-3 ${
          centered
            ? 'flex-col items-center justify-center gap-1.5 text-center'
            : 'flex-row items-center gap-2.5'
        }`}
        style={{ background: theme.gradient }}
      >
        <PressIconBox theme={theme} size="xs" />
        <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
          <span
            className="block text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: theme.badgeText }}
          >
            {item.source}
          </span>
          <h3
            className="text-xs font-bold leading-tight line-clamp-2"
            style={{ color: theme.titleText }}
          >
            {item.title}
          </h3>
        </div>
        {!centered && hasClickableUrl(item.url) && (
          <span style={{ color: theme.bodyText }}>
            <ArrowIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </PressShell>
  )
}

export function PressCard({
  item,
  grid = false,
  pageBackground = '#000000',
}: {
  item: PressCardType
  grid?: boolean
  pageBackground?: string
}) {
  const theme = resolveAppHeroTheme(buildPressTheme(item.accentColor), pageBackground)
  const layout = resolveLayout(item, grid)
  const align = resolveAlign(item)

  switch (layout) {
    case 'compact':
      return <PressCompact item={item} theme={theme} align={align} />
    case 'condensed':
      return <PressCondensed item={item} theme={theme} align={align} />
    default:
      return <PressDefault item={item} theme={theme} align={align} />
  }
}
