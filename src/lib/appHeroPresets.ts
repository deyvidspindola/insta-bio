import type { AppHero, AppHeroPreset, IconName } from '../types/bio'

export interface AppHeroTheme {
  border: string
  borderHover: string
  gradient: string
  glow: string
  badgeText: string
  iconBg: string
  iconRing: string
  iconColor: string
  pulseBorder: string
  ctaBg: string
  ctaText: string
  ctaShadow: string
}

export interface AppHeroPresetConfig {
  label: string
  defaults: Pick<AppHero, 'badge' | 'title' | 'description' | 'cta' | 'url'>
  theme: AppHeroTheme
  icon: 'whatsapp' | 'instagram' | 'youtube' | 'form' | 'telegram' | 'bio'
  defaultIcon?: IconName
}

export const APP_HERO_PRESETS: Record<AppHeroPreset, AppHeroPresetConfig> = {
  whatsapp: {
    label: 'WhatsApp',
    defaults: {
      badge: 'Comunidade',
      title: 'Entre na comunidade',
      description: 'Grupo exclusivo com avisos, conteúdos e interação em tempo real.',
      cta: 'Entrar agora',
      url: 'https://wa.me/',
    },
    theme: {
      border: 'rgba(37,211,102,0.4)',
      borderHover: 'rgba(37,211,102,0.7)',
      gradient:
        'linear-gradient(135deg, rgba(37,211,102,0.22) 0%, rgba(18,140,126,0.18) 55%, rgba(15,32,28,0.6) 100%)',
      glow: 'rgba(37,211,102,0.35)',
      badgeText: '#7AE3A8',
      iconBg: 'rgba(37,211,102,0.25)',
      iconRing: 'rgba(37,211,102,0.45)',
      iconColor: '#25D366',
      pulseBorder: 'rgba(37,211,102,0.6)',
      ctaBg: '#25D366',
      ctaText: '#000000',
      ctaShadow: '0 10px 30px -10px rgba(37,211,102,0.7)',
    },
    icon: 'whatsapp',
  },
  youtube: {
    label: 'YouTube',
    defaults: {
      badge: 'Canal',
      title: 'Assista nossos vídeos',
      description: 'Lives, pregações, tutoriais e conteúdos exclusivos no YouTube.',
      cta: 'Ver canal',
      url: 'https://youtube.com/',
    },
    theme: {
      border: 'rgba(255,0,0,0.35)',
      borderHover: 'rgba(255,0,0,0.6)',
      gradient:
        'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(180,0,0,0.15) 55%, rgba(20,10,10,0.65) 100%)',
      glow: 'rgba(255,0,0,0.3)',
      badgeText: '#FF8A8A',
      iconBg: 'rgba(255,0,0,0.2)',
      iconRing: 'rgba(255,0,0,0.4)',
      iconColor: '#FF0000',
      pulseBorder: 'rgba(255,0,0,0.55)',
      ctaBg: '#FF0000',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(255,0,0,0.55)',
    },
    icon: 'youtube',
  },
  instagram: {
    label: 'Instagram',
    defaults: {
      badge: 'Redes sociais',
      title: 'Siga no Instagram',
      description: 'Acompanhe novidades, bastidores e conteúdo do dia a dia.',
      cta: 'Ver perfil',
      url: 'https://instagram.com/',
    },
    theme: {
      border: 'rgba(225,48,108,0.4)',
      borderHover: 'rgba(225,48,108,0.65)',
      gradient:
        'linear-gradient(135deg, rgba(131,58,180,0.25) 0%, rgba(225,48,108,0.18) 50%, rgba(247,119,55,0.12) 100%)',
      glow: 'rgba(225,48,108,0.3)',
      badgeText: '#F9A8D4',
      iconBg: 'rgba(225,48,108,0.2)',
      iconRing: 'rgba(225,48,108,0.4)',
      iconColor: '#E1306C',
      pulseBorder: 'rgba(225,48,108,0.55)',
      ctaBg: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(225,48,108,0.5)',
    },
    icon: 'instagram',
  },
  form: {
    label: 'Formulário',
    defaults: {
      badge: 'Inscrição',
      title: 'Participe do evento',
      description: 'Preencha o formulário e garanta sua vaga em poucos minutos.',
      cta: 'Preencher formulário',
      url: 'https://',
    },
    theme: {
      border: 'rgba(59,130,246,0.35)',
      borderHover: 'rgba(59,130,246,0.6)',
      gradient:
        'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.15) 55%, rgba(15,23,42,0.65) 100%)',
      glow: 'rgba(59,130,246,0.3)',
      badgeText: '#93C5FD',
      iconBg: 'rgba(59,130,246,0.2)',
      iconRing: 'rgba(59,130,246,0.4)',
      iconColor: '#3B82F6',
      pulseBorder: 'rgba(59,130,246,0.55)',
      ctaBg: '#3B82F6',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(59,130,246,0.5)',
    },
    icon: 'form',
    defaultIcon: 'form',
  },
  telegram: {
    label: 'Telegram',
    defaults: {
      badge: 'Comunidade',
      title: 'Entre no grupo do Telegram',
      description: 'Receba avisos e participe da comunidade pelo Telegram.',
      cta: 'Entrar no grupo',
      url: 'https://t.me/',
    },
    theme: {
      border: 'rgba(42,171,238,0.35)',
      borderHover: 'rgba(42,171,238,0.6)',
      gradient:
        'linear-gradient(135deg, rgba(42,171,238,0.2) 0%, rgba(34,158,217,0.15) 55%, rgba(10,25,35,0.65) 100%)',
      glow: 'rgba(42,171,238,0.3)',
      badgeText: '#7DD3FC',
      iconBg: 'rgba(42,171,238,0.2)',
      iconRing: 'rgba(42,171,238,0.4)',
      iconColor: '#2AABEE',
      pulseBorder: 'rgba(42,171,238,0.55)',
      ctaBg: '#2AABEE',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(42,171,238,0.5)',
    },
    icon: 'telegram',
  },
  custom: {
    label: 'Personalizado',
    defaults: {
      badge: 'Destaque',
      title: 'Título do card',
      description: 'Descrição do destaque com link para qualquer serviço.',
      cta: 'Acessar',
      url: 'https://',
    },
    theme: {
      border: 'color-mix(in oklch, var(--color-primary) 40%, transparent)',
      borderHover: 'color-mix(in oklch, var(--color-primary) 65%, transparent)',
      gradient:
        'linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 22%, transparent) 0%, color-mix(in oklch, var(--color-primary) 12%, transparent) 55%, rgba(15,20,30,0.65) 100%)',
      glow: 'color-mix(in oklch, var(--color-primary) 35%, transparent)',
      badgeText: 'var(--color-primary)',
      iconBg: 'color-mix(in oklch, var(--color-primary) 20%, transparent)',
      iconRing: 'color-mix(in oklch, var(--color-primary) 40%, transparent)',
      iconColor: 'var(--color-primary)',
      pulseBorder: 'color-mix(in oklch, var(--color-primary) 55%, transparent)',
      ctaBg: 'var(--color-primary)',
      ctaText: 'var(--color-background)',
      ctaShadow: '0 10px 30px -10px color-mix(in oklch, var(--color-primary) 55%, transparent)',
    },
    icon: 'bio',
    defaultIcon: 'sparkles',
  },
}

export const APP_HERO_PRESET_LIST = Object.entries(APP_HERO_PRESETS).map(([value, config]) => ({
  value: value as AppHeroPreset,
  label: config.label,
}))

export function createAppHero(preset: AppHeroPreset): AppHero {
  const config = APP_HERO_PRESETS[preset]
  return {
    type: 'app-hero',
    preset,
    ...config.defaults,
    ...(preset === 'custom' ? { icon: config.defaultIcon } : {}),
  }
}

export function appHeroFromWhatsApp(item: {
  badge: string
  title: string
  description: string
  cta: string
  url: string
}): AppHero {
  return { type: 'app-hero', preset: 'whatsapp', ...item }
}
