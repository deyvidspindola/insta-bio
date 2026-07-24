import type { ReactNode } from 'react'
import type { FeatureCard as FeatureCardType, IconName } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { resolveAccentCardTheme } from '../lib/accentTheme'
import type { ResolvedAppHeroTheme } from '../lib/appHeroContrast'
import { ArrowIcon, BioIcon } from './icons'
import { CardCoverImage } from './CardCoverImage'

function FeatureShell({
  item,
  theme,
  children,
  className = '',
}: {
  item: FeatureCardType
  theme: ResolvedAppHeroTheme
  children: ReactNode
  className?: string
}) {
  const clickable = hasClickableUrl(item.url)

  return (
    <CardLink
      url={item.url}
      className={`bio-card bio-card--media bio-card--feature group relative block overflow-hidden border transition-all ${className} ${
        clickable ? '' : 'cursor-default'
      }`}
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

function FeatureIconBox({
  theme,
  icon,
  size = 'md',
}: {
  theme: ResolvedAppHeroTheme
  icon: IconName
  size?: 'md' | 'sm'
}) {
  const box = size === 'sm' ? 'h-12 w-12 rounded-xl sm:h-14 sm:w-[60px]' : 'h-14 w-14 rounded-2xl'
  const iconSize = size === 'sm' ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-7 w-7'

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={{
        background: theme.iconBg,
        boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
      }}
    >
      <span style={{ color: theme.iconColor }}>
        <BioIcon name={icon} className={iconSize} />
      </span>
    </div>
  )
}

function FeatureCta({ theme, label }: { theme: ResolvedAppHeroTheme; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all group-hover:gap-2.5"
      style={{
        background: theme.ctaBg,
        color: theme.ctaText,
        boxShadow: theme.ctaShadow,
      }}
    >
      {label}
    </span>
  )
}

function TagPill({
  theme,
  label,
  icon,
}: {
  theme: ResolvedAppHeroTheme
  label: string
  icon?: IconName
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md"
      style={{
        background: theme.iconBg,
        color: theme.badgeText,
        boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
      }}
    >
      {icon && <BioIcon name={icon} className="mr-1 h-3 w-3" />}
      {label}
    </span>
  )
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
  const clickable = hasClickableUrl(item.url)
  const hasImage = Boolean(item.image?.trim())
  const theme = resolveAccentCardTheme(item.accentColor, pageBackground, item.gradient)
  const shellExtra = grid ? 'h-full' : ''

  if (item.variant === 'square') {
    return (
      <FeatureShell item={item} theme={theme} className={`${shellExtra} aspect-square`}>
          <CardCoverImage
            src={item.image}
            alt={item.title}
            gradient={theme.gradient}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        {hasImage ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        ) : null}

        {item.badge && (
          <span
            className="absolute left-2 top-2 text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: hasImage ? 'rgba(255,255,255,0.9)' : theme.badgeText }}
          >
            {item.badge}
          </span>
        )}

        {clickable && (
          <span
            className="absolute right-2 top-2"
            style={{ color: hasImage ? 'rgba(255,255,255,0.9)' : theme.bodyText }}
          >
            <ArrowIcon className="h-4 w-4 drop-shadow" />
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3
            className="text-base font-bold leading-tight"
            style={{ color: hasImage ? '#FFFFFF' : theme.titleText }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p
              className="mt-0.5 text-[10px]"
              style={{ color: hasImage ? 'rgba(255,255,255,0.85)' : theme.bodyText }}
            >
              {item.description}
            </p>
          )}
        </div>
      </FeatureShell>
    )
  }

  if (item.variant === 'portrait') {
    return (
      <FeatureShell item={item} theme={theme} className={shellExtra}>
        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[3/4]">
          <CardCoverImage
            src={item.image}
            alt={item.title}
            gradient={theme.gradient}
            fallbackSize="lg"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {item.tags && item.tags.length > 0 && (
            <div className="absolute left-3 top-3 inline-flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
                <TagPill key={tag.label} theme={theme} label={tag.label} icon={tag.icon} />
              ))}
            </div>
          )}

          {item.badge && !(item.tags && item.tags.length > 0) && (
            <span className="absolute left-3 top-3">
              <TagPill theme={theme} label={item.badge} />
            </span>
          )}

          {clickable && (
            <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            {item.badge && item.tags && item.tags.length > 0 && (
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: theme.badgeText }}
              >
                {item.badge}
              </span>
            )}
            <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">{item.title}</h3>
            <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
          </div>
        </div>
      </FeatureShell>
    )
  }

  if (item.variant === 'banner') {
    return (
      <FeatureShell item={item} theme={theme} className={shellExtra}>
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <CardCoverImage
            src={item.image}
            alt={item.title}
            gradient={theme.gradient}
            fallbackSize="lg"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <div
            aria-hidden="true"
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background: `linear-gradient(135deg, ${theme.glow} 0%, transparent 55%)`,
            }}
          />

          {item.tags && item.tags.length > 0 && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5">
              {item.tags.map((tag) => (
                <TagPill key={tag.label} theme={theme} label={tag.label} icon={tag.icon} />
              ))}
            </div>
          )}

          {clickable && (
            <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                {item.badge && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: theme.badgeText }}
                  >
                    {item.badge}
                  </span>
                )}
                <h3 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
              </div>
              {item.cta && (
                <span className="hidden shrink-0 sm:inline-flex">
                  <FeatureCta theme={theme} label={item.cta} />
                </span>
              )}
            </div>
            {item.cta && (
              <span className="mt-3 inline-flex sm:hidden">
                <FeatureCta theme={theme} label={item.cta} />
              </span>
            )}
          </div>
        </div>
      </FeatureShell>
    )
  }

  if (item.variant === 'compact') {
    return (
      <FeatureShell item={item} theme={theme} className={`${shellExtra} h-full`}>
        <div className="relative overflow-hidden p-4 sm:p-5" style={{ background: theme.gradient }}>
          <div className="relative flex items-center gap-3 sm:gap-4">
            {item.icon && <FeatureIconBox theme={theme} icon={item.icon} size="sm" />}
            <div className="min-w-0 flex-1">
              {item.badge && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: theme.badgeText }}
                >
                  {item.badge}
                </span>
              )}
              <h3
                className="mt-0.5 text-base font-bold leading-tight sm:text-lg"
                style={{ color: theme.titleText }}
              >
                {item.title}
              </h3>
              <p className="mt-0.5 text-[11px] sm:text-xs" style={{ color: theme.bodyText }}>
                {item.description}
              </p>
            </div>
            {clickable && (
              <span style={{ color: theme.bodyText }}>
                <ArrowIcon className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            )}
          </div>
        </div>
      </FeatureShell>
    )
  }

  const centered = item.align === 'center'

  return (
    <FeatureShell item={item} theme={theme} className={shellExtra}>
      <div className="relative p-5 sm:p-6" style={{ background: theme.gradient }}>
        {clickable && (
          <span style={{ color: theme.bodyText }}>
            <ArrowIcon className="absolute right-3 top-3 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
            <div className={centered ? 'mb-3' : ''}>
              <FeatureIconBox theme={theme} icon={item.icon} />
            </div>
          )}
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            {item.badge && (
              <span
                className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.badgeText }}
              >
                {item.badge}
              </span>
            )}
            <h3
              className="mt-1 text-xl font-bold leading-tight sm:text-2xl"
              style={{ color: theme.titleText }}
            >
              {item.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed sm:text-sm" style={{ color: theme.bodyText }}>
              {item.description}
            </p>
            {item.cta && (
              <span className="mt-3 inline-flex">
                <FeatureCta theme={theme} label={item.cta} />
              </span>
            )}
          </div>
        </div>
      </div>
    </FeatureShell>
  )
}
