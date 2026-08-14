import type { ReactNode } from 'react'
import type { AppHero, AppHeroPreset, FeatureCardAlign, WhatsAppHero } from '../types/bio'
import {
  CardLink,
  isCardInteractive,
  resolveCopyText,
  useCardAction,
} from '../lib/cardLink'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { resolveAppHeroTheme, type ResolvedAppHeroTheme } from '../lib/appHeroContrast'
import { BioIcon, InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './icons'
import { CardActionIcon } from './CardActionIcon'

type AppHeroLike = AppHero | WhatsAppHero

function resolvePreset(item: AppHeroLike): AppHeroPreset {
  if (item.type === 'whatsapp-hero') return 'whatsapp'
  return item.preset
}

function resolveLayout(item: AppHeroLike, grid: boolean) {
  if (item.layout === 'condensed') return 'condensed'
  if (grid || item.layout === 'compact') return 'compact'
  return item.layout ?? 'default'
}

function resolveAlign(item: AppHeroLike): FeatureCardAlign {
  return item.align === 'center' ? 'center' : 'side'
}

/** Personalizado sem ícone → não reserva espaço do ícone. Presets de marca mantêm o ícone. */
function resolveShowIcon(item: AppHeroLike, preset: AppHeroPreset): boolean {
  if (preset !== 'custom') return true
  return item.type === 'app-hero' && Boolean(item.icon)
}

function AppHeroIcon({
  preset,
  icon,
  color,
  className,
}: {
  preset: AppHeroPreset
  icon?: AppHero['icon']
  color: string
  className?: string
}) {
  const config = APP_HERO_PRESETS[preset]

  const inner = (() => {
    switch (config.icon) {
      case 'whatsapp':
        return <WhatsAppIcon className={className} />
      case 'instagram':
        return <InstagramIcon className={className} />
      case 'youtube':
        return <YouTubeIcon className={className} />
      case 'telegram':
        return <TelegramIcon className={className} />
      case 'form':
        return <BioIcon name="form" className={className} />
      default:
        if (!icon) return null
        return <BioIcon name={icon} className={className} />
    }
  })()

  if (!inner) return null
  return <span style={{ color }}>{inner}</span>
}

function HeroIconBox({
  preset,
  icon,
  theme,
  size = 'md',
}: {
  preset: AppHeroPreset
  icon?: AppHero['icon']
  theme: ResolvedAppHeroTheme
  size?: 'md' | 'sm' | 'xs'
}) {
  const box =
    size === 'xs'
      ? 'h-9 w-9 rounded-lg'
      : size === 'sm'
        ? 'h-10 w-10 rounded-xl'
        : 'h-14 w-14 rounded-2xl'
  const iconSize = size === 'xs' ? 'h-4 w-4' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  if (size === 'md') {
    return (
      <div className="relative shrink-0">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `1px solid ${theme.pulseBorder}`,
            animation: 'bio-pulse 2.4s ease-out infinite',
          }}
        />
        <div
          className={`flex ${box} items-center justify-center ring-1`}
          style={{
            background: theme.iconBg,
            boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
          }}
        >
          <AppHeroIcon preset={preset} icon={icon} color={theme.iconColor} className={iconSize} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex shrink-0 ${box} items-center justify-center ring-1`}
      style={{
        background: theme.iconBg,
        boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
      }}
    >
      <AppHeroIcon preset={preset} icon={icon} color={theme.iconColor} className={iconSize} />
    </div>
  )
}

function HeroCtaLabel({ label }: { label: string }) {
  const { copied } = useCardAction()
  return (
    <>
      <span className="truncate">{copied ? 'Copiado!' : label}</span>
      <CardActionIcon className="h-3.5 w-3.5 shrink-0" />
    </>
  )
}

function HeroShell({
  item,
  theme,
  children,
  className = '',
}: {
  item: AppHeroLike
  theme: ResolvedAppHeroTheme
  children: ReactNode
  className?: string
}) {
  const interactive = isCardInteractive(item.action, item.url, item.cta, item.pageSlug)

  return (
    <CardLink
      url={item.url}
      action={item.action}
      pageSlug={item.pageSlug}
      copyText={resolveCopyText(item.cta, item.url)}
      className={`bio-card bio-card--hero bio-card--media group relative block overflow-hidden border transition-all ${className} ${interactive ? '' : 'cursor-default'}`}
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => {
        if (!interactive) return
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

function HeroDefault({
  item,
  preset,
  theme,
  icon,
  showIcon,
  align,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: ResolvedAppHeroTheme
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <HeroShell item={item} theme={theme}>
      <div className="relative p-5 sm:p-6" style={{ background: theme.gradient }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
          style={{
            background: theme.glow,
            animation: 'bio-glow 4s ease-in-out infinite',
          }}
        />
        <div
          className={
            centered
              ? 'relative z-10 flex flex-col items-center text-center'
              : 'relative z-10 flex items-center gap-4'
          }
        >
          {showIcon && (
            <div className={centered ? 'mb-3' : ''}>
              <HeroIconBox preset={preset} icon={icon} theme={theme} size="md" />
            </div>
          )}
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            <span
              className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.badgeText }}
            >
              {item.badge}
            </span>
            <h3 className="mt-1 text-xl font-bold leading-tight" style={{ color: theme.titleText }}>
              {item.title}
            </h3>
            <p
              className="mt-1.5 text-xs leading-relaxed sm:text-sm"
              style={{ color: theme.bodyText }}
            >
              {item.description}
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all group-hover:gap-2.5"
              style={{
                background: theme.ctaBg,
                color: theme.ctaText,
                boxShadow: theme.ctaShadow,
              }}
            >
              <HeroCtaLabel label={item.cta} />
            </span>
          </div>
        </div>
      </div>
    </HeroShell>
  )
}

function HeroCompact({
  item,
  preset,
  theme,
  icon,
  showIcon,
  align,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: ResolvedAppHeroTheme
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <HeroShell item={item} theme={theme} className="h-full">
      <div
        className={`relative flex h-full min-h-[132px] p-3.5 ${
          centered ? 'flex-col items-center text-center' : 'flex-row items-center gap-3'
        }`}
        style={{ background: theme.gradient }}
      >
        {showIcon && <HeroIconBox preset={preset} icon={icon} theme={theme} size="sm" />}
        <div
          className={`flex min-w-0 flex-1 flex-col ${centered ? 'mt-2 w-full items-center' : ''}`}
        >
          <h3
            className={`line-clamp-2 flex-1 text-sm font-bold leading-snug ${
              centered ? '' : ''
            }`}
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
            <HeroCtaLabel label={item.cta} />
          </span>
        </div>
      </div>
    </HeroShell>
  )
}

function HeroCondensed({
  item,
  preset,
  theme,
  icon,
  showIcon,
  align,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: ResolvedAppHeroTheme
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <HeroShell item={item} theme={theme} className="h-full">
      <div
        className={`flex h-full min-h-[72px] p-3 ${
          centered
            ? 'flex-col items-center justify-center gap-1.5 text-center'
            : 'flex-row items-center gap-2.5'
        }`}
        style={{ background: theme.gradient }}
      >
        {showIcon && <HeroIconBox preset={preset} icon={icon} theme={theme} size="xs" />}
        <h3
          className={`min-w-0 text-xs font-bold leading-tight line-clamp-2 ${
            centered ? 'w-full' : 'flex-1'
          }`}
          style={{ color: theme.titleText }}
        >
          {item.title}
        </h3>
        {!centered && isCardInteractive(item.action, item.url, item.cta, item.pageSlug) && (
          <span style={{ color: theme.bodyText }}>
            <CardActionIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </HeroShell>
  )
}

export function AppHeroCard({
  item,
  grid = false,
  pageBackground = '#000000',
}: {
  item: AppHeroLike
  grid?: boolean
  /** Fundo efetivo da bio — ver BioPage.tsx (resolveEffectiveBioBackground). */
  pageBackground?: string
}) {
  const preset = resolvePreset(item)
  const theme = resolveAppHeroTheme(APP_HERO_PRESETS[preset].theme, pageBackground)
  const customIcon = item.type === 'app-hero' ? item.icon : undefined
  const layout = resolveLayout(item, grid)
  const align = resolveAlign(item)
  const showIcon = resolveShowIcon(item, preset)

  const props = { item, preset, theme, icon: customIcon, showIcon, align }

  switch (layout) {
    case 'compact':
      return <HeroCompact {...props} />
    case 'condensed':
      return <HeroCondensed {...props} />
    default:
      return <HeroDefault {...props} />
  }
}
