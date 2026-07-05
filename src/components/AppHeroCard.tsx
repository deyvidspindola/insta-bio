import type { ReactNode } from 'react'
import type { AppHero, AppHeroPreset, WhatsAppHero } from '../types/bio'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { ArrowIcon, BioIcon, InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './icons'

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
        return (
          <BioIcon
            name={icon ?? config.defaultIcon ?? 'sparkles'}
            className={className}
          />
        )
    }
  })()

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
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
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

function HeroShell({
  item,
  theme,
  children,
  className = '',
}: {
  item: AppHeroLike
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`bio-card bio-card--hero bio-card--media group relative block overflow-hidden border transition-all ${className}`}
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.borderHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
      }}
    >
      {children}
    </a>
  )
}

function HeroDefault({
  item,
  preset,
  theme,
  icon,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  icon?: AppHero['icon']
}) {
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
        <div className="relative z-10 flex items-start gap-4">
          <HeroIconBox preset={preset} icon={icon} theme={theme} size="md" />
          <div className="min-w-0 flex-1">
            <span
              className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.badgeText }}
            >
              {item.badge}
            </span>
            <h3 className="mt-1 text-xl font-bold leading-tight text-white">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">
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
              {item.cta}
              <ArrowIcon className="h-3.5 w-3.5" />
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
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  icon?: AppHero['icon']
}) {
  return (
    <HeroShell item={item} theme={theme} className="h-full">
      <div
        className="relative flex h-full min-h-[132px] flex-col p-3.5"
        style={{ background: theme.gradient }}
      >
        <HeroIconBox preset={preset} icon={icon} theme={theme} size="sm" />
        <h3 className="mt-2 line-clamp-2 flex-1 text-sm font-bold leading-snug text-white">
          {item.title}
        </h3>
        <span
          className="mt-2 inline-flex w-fit max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: theme.ctaBg,
            color: theme.ctaText,
            boxShadow: theme.ctaShadow,
          }}
        >
          <span className="truncate">{item.cta}</span>
          <ArrowIcon className="h-3 w-3 shrink-0" />
        </span>
      </div>
    </HeroShell>
  )
}

function HeroCondensed({
  item,
  preset,
  theme,
  icon,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  icon?: AppHero['icon']
}) {
  return (
    <HeroShell item={item} theme={theme} className="h-full">
      <div
        className="flex h-full min-h-[72px] items-center gap-2.5 p-3"
        style={{ background: theme.gradient }}
      >
        <HeroIconBox preset={preset} icon={icon} theme={theme} size="xs" />
        <h3 className="min-w-0 flex-1 text-xs font-bold leading-tight text-white line-clamp-2">
          {item.title}
        </h3>
        <ArrowIcon className="h-3.5 w-3.5 shrink-0 text-white/85 transition-transform group-hover:translate-x-0.5" />
      </div>
    </HeroShell>
  )
}

export function AppHeroCard({ item, grid = false }: { item: AppHeroLike; grid?: boolean }) {
  const preset = resolvePreset(item)
  const theme = APP_HERO_PRESETS[preset].theme
  const customIcon = item.type === 'app-hero' ? item.icon : undefined
  const layout = resolveLayout(item, grid)

  const props = { item, preset, theme, icon: customIcon }

  switch (layout) {
    case 'compact':
      return <HeroCompact {...props} />
    case 'condensed':
      return <HeroCondensed {...props} />
    default:
      return <HeroDefault {...props} />
  }
}
