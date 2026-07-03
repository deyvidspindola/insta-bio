import type { AppHero, AppHeroPreset, WhatsAppHero } from '../types/bio'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { ArrowIcon, BioIcon, InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './icons'

type AppHeroLike = AppHero | WhatsAppHero

function resolvePreset(item: AppHeroLike): AppHeroPreset {
  if (item.type === 'whatsapp-hero') return 'whatsapp'
  return item.preset
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

export function AppHeroCard({ item }: { item: AppHeroLike }) {
  const preset = resolvePreset(item)
  const theme = APP_HERO_PRESETS[preset].theme
  const customIcon = item.type === 'app-hero' ? item.icon : undefined

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-3xl border transition-all"
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.borderHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
      }}
    >
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
              className="flex h-14 w-14 items-center justify-center rounded-2xl ring-1"
              style={{
                background: theme.iconBg,
                boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
              }}
            >
              <AppHeroIcon
                preset={preset}
                icon={customIcon}
                color={theme.iconColor}
                className="h-7 w-7"
              />
            </div>
          </div>
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
    </a>
  )
}
