import type {
  BioBrand,
  BioConfig,
  BioSection,
  BioTemplate,
  SocialLink,
} from '../types/bio'
import { BACKGROUND_PRESETS } from './backgroundPresets'
import { SHOWCASE_THEME_PACKS } from './themePacksShowcase'

/** Snapshot aplicável de um template completo (visual + conteúdo sugestivo). */
export interface ThemePackSnapshot {
  template: BioTemplate
  theme: BioBrand['theme']
  /** Seções da bio-modelo (links e cards sugestivos). */
  sections: BioSection[]
  /** Sugestões de identidade (não sobrescrevem nome/logo/Instagram). */
  brand?: {
    tagline?: string
    location?: string
    socialLinks?: SocialLink[]
    /** Banner no header da bio */
    coverImage?: string
  }
}

export interface ThemePack {
  id: string
  name: string
  niche: string
  description: string
  snapshot: ThemePackSnapshot
}

const WA = 'https://wa.me/5511999999999'
const SITE = 'https://exemplo.com'
const MAPS = 'https://maps.google.com'
const IG = 'https://www.instagram.com/'

function themeFromPreset(
  presetId: string,
  cardRadius: number,
  overrides?: Partial<BioBrand['theme']>,
): BioBrand['theme'] {
  const preset = BACKGROUND_PRESETS.find((p) => p.id === presetId)
  if (!preset) {
    throw new Error(`Preset de fundo não encontrado: ${presetId}`)
  }
  return {
    primary: preset.primary,
    secondary: preset.secondary,
    glow: preset.glow,
    background: preset.edgeColor,
    backgroundPreset: preset.id,
    backgroundImage: undefined,
    backgroundOverlayOpacity: undefined,
    cardRadius,
    ...overrides,
  }
}

function pack(input: {
  id: string
  name: string
  niche: string
  description: string
  presetId: string
  template: BioTemplate
  cardRadius: number
  themeOverrides?: Partial<BioBrand['theme']>
  brand?: ThemePackSnapshot['brand']
  sections: BioSection[]
}): ThemePack {
  return {
    id: input.id,
    name: input.name,
    niche: input.niche,
    description: input.description,
    snapshot: {
      template: input.template,
      theme: themeFromPreset(input.presetId, input.cardRadius, input.themeOverrides),
      brand: input.brand,
      sections: input.sections,
    },
  }
}

/** Galeria: packs simples + bios-modelo showcase (mídia, grid, foto…). */
export const THEME_PACKS: ThemePack[] = [
  ...SHOWCASE_THEME_PACKS,
  pack({
    id: 'dark-agency',
    name: 'Agência Dark',
    niche: 'DARK AGENCY',
    description: 'Bio para agência ou freela: portfolio, briefing e contato.',
    presetId: 'slate-glow',
    template: 'solid',
    cardRadius: 40,
    brand: {
      tagline: 'Design · Branding · Performance',
      location: 'São Paulo · Remoto',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'linkedin', url: 'https://linkedin.com/' },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'cta',
        title: 'Contato',
        hideTitle: true,
        items: [
          {
            type: 'whatsapp-hero',
            badge: 'Projeto novo',
            title: 'Vamos conversar?',
            description: 'Conte o desafio da marca — respondo em até 1 dia útil.',
            cta: 'Chamar no WhatsApp',
            url: WA,
          },
        ],
      },
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Portfólio',
            subtitle: 'Cases e trabalhos recentes',
            url: SITE,
            icon: 'briefcase',
          },
          {
            type: 'link',
            title: 'Briefing rápido',
            subtitle: 'Formulário para orçamento',
            url: `${SITE}/briefing`,
            icon: 'form',
          },
          {
            type: 'link',
            title: 'Instagram',
            subtitle: 'Bastidores e lançamentos',
            url: IG,
            icon: 'instagram',
          },
        ],
      },
    ],
  }),
  pack({
    id: 'minimal-gold',
    name: 'Minimalista Gold',
    niche: 'GOLD',
    description: 'Igreja ou ministério: cultos, grupos e doações.',
    presetId: 'gold-church',
    // Soft: cards escuros + ouro só no acento (outline no fundo dourado ficava ilegível)
    template: 'soft',
    cardRadius: 28,
    brand: {
      tagline: 'Uma família · Uma fé · Uma missão',
      location: 'Cultos · Dom e Qua',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'youtube', url: 'https://youtube.com/' },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'destaque',
        title: 'Destaque',
        hideTitle: true,
        items: [
          {
            type: 'feature',
            variant: 'gradient',
            badge: 'Próximo culto',
            title: 'Domingo 10h e 19h',
            description: 'Venha adorar com a gente — salão principal.',
            cta: 'Como chegar',
            url: MAPS,
            icon: 'church',
            gradient:
              'linear-gradient(145deg, oklch(0.30 0.05 85) 0%, oklch(0.16 0.03 80) 55%, oklch(0.12 0.02 75) 100%)',
          },
        ],
      },
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Horários e cultos',
            subtitle: 'Programação da semana',
            url: SITE,
            icon: 'calendar',
          },
          {
            type: 'link',
            title: 'Grupos e células',
            subtitle: 'Encontre sua comunidade',
            url: `${SITE}/celulas`,
            icon: 'users',
          },
          {
            type: 'link',
            title: 'Ofertas e dízimos',
            subtitle: 'Contribua com segurança',
            url: `${SITE}/ofertas`,
            icon: 'heart',
          },
          {
            type: 'link',
            title: 'WhatsApp da igreja',
            subtitle: 'Dúvidas e oração',
            url: WA,
            icon: 'whatsapp',
          },
        ],
      },
    ],
  }),

  pack({
    id: 'saude-clean',
    name: 'Saúde Clean',
    niche: 'CLÍNICA',
    description: 'Clínica ou consultório: agendar, endereço e especialidades.',
    presetId: 'teal-clinic',
    template: 'pill',
    cardRadius: 100,
    brand: {
      tagline: 'Cuidado com atenção e acolhimento',
      location: 'Consultório · Centro',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'cta',
        title: 'Agendar',
        hideTitle: true,
        items: [
          {
            type: 'whatsapp-hero',
            badge: 'Agenda aberta',
            title: 'Marque sua consulta',
            description: 'Atendimento humanizado — responda e reserve o horário.',
            cta: 'Agendar no WhatsApp',
            url: WA,
          },
        ],
      },
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Especialidades',
            subtitle: 'O que atendemos',
            url: `${SITE}/especialidades`,
            icon: 'heart',
          },
          {
            type: 'link',
            title: 'Convênios',
            subtitle: 'Planos aceitos',
            url: `${SITE}/convenios`,
            icon: 'card',
          },
          {
            type: 'location',
            title: 'Como chegar',
            address: 'Rua Exemplo, 100 — Centro',
            mapUrl: MAPS,
          },
        ],
      },
    ],
  }),

  pack({
    id: 'ocean-pro',
    name: 'Oceano Pro',
    niche: 'CORPORATIVO',
    description: 'Empresa ou B2B: site, materiais e contato comercial.',
    presetId: 'ocean-glow',
    template: 'classic',
    cardRadius: 50,
    brand: {
      tagline: 'Soluções que geram resultado',
      location: 'Brasil · Atendimento nacional',
      socialLinks: [
        { network: 'linkedin', url: 'https://linkedin.com/' },
        { network: 'instagram', url: IG },
        { network: 'email', url: 'mailto:contato@exemplo.com' },
      ],
    },
    sections: [
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Site institucional',
            subtitle: 'Conheça a empresa',
            url: SITE,
            icon: 'globe',
          },
          {
            type: 'link',
            title: 'Falar com comercial',
            subtitle: 'Orçamentos e parcerias',
            url: WA,
            icon: 'briefcase',
          },
          {
            type: 'link',
            title: 'Materiais e cases',
            subtitle: 'PDF e apresentações',
            url: `${SITE}/materiais`,
            icon: 'file',
          },
          {
            type: 'link',
            title: 'Trabalhe conosco',
            subtitle: 'Vagas abertas',
            url: `${SITE}/carreiras`,
            icon: 'users',
          },
        ],
      },
    ],
  }),

  pack({
    id: 'violet-glass',
    name: 'Violeta Glass',
    niche: 'CRIATIVO',
    description: 'Criador ou artista: portfólio, agenda e redes.',
    presetId: 'violet-glow',
    template: 'glass',
    cardRadius: 55,
    brand: {
      tagline: 'Conteúdo · Arte · Experiências',
      location: 'Online · Tours',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'tiktok', url: 'https://tiktok.com/' },
        { network: 'youtube', url: 'https://youtube.com/' },
      ],
    },
    sections: [
      {
        id: 'destaque',
        title: 'Destaque',
        hideTitle: true,
        items: [
          {
            type: 'feature',
            variant: 'gradient',
            badge: 'Novo',
            title: 'Último lançamento',
            description: 'Assista / ouça o projeto mais recente.',
            cta: 'Ver agora',
            url: SITE,
            icon: 'sparkles',
          },
        ],
      },
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Portfólio',
            subtitle: 'Trabalhos selecionados',
            url: `${SITE}/portfolio`,
            icon: 'palette',
          },
          {
            type: 'link',
            title: 'Agenda e shows',
            subtitle: 'Próximas datas',
            url: `${SITE}/agenda`,
            icon: 'calendar',
          },
          {
            type: 'link',
            title: 'Contrate',
            subtitle: 'Orçamento para eventos',
            url: WA,
            icon: 'whatsapp',
          },
        ],
      },
    ],
  }),

  pack({
    id: 'amber-soft',
    name: 'Âmbar Soft',
    niche: 'GASTRO',
    description: 'Restaurante ou café: cardápio, reserva e delivery.',
    presetId: 'amber-warm',
    template: 'soft',
    cardRadius: 45,
    brand: {
      tagline: 'Sabores feitos com carinho',
      location: 'Aberto todos os dias · 11h–23h',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'cta',
        title: 'Reserva',
        hideTitle: true,
        items: [
          {
            type: 'whatsapp-hero',
            badge: 'Mesas',
            title: 'Reserve sua mesa',
            description: 'Informe dia, horário e quantidade de pessoas.',
            cta: 'Reservar no WhatsApp',
            url: WA,
          },
        ],
      },
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Cardápio',
            subtitle: 'Pratos e bebidas',
            url: `${SITE}/cardapio`,
            icon: 'utensils',
          },
          {
            type: 'link',
            title: 'Delivery',
            subtitle: 'Peça pelo app ou WhatsApp',
            url: WA,
            icon: 'cart',
          },
          {
            type: 'location',
            title: 'Endereço',
            address: 'Av. Exemplo, 500 — Bairro',
            mapUrl: MAPS,
          },
        ],
      },
    ],
  }),

  pack({
    id: 'cobalt-solid',
    name: 'Cobalto Sólido',
    niche: 'TECH',
    description: 'SaaS ou tech: produto, demo e suporte.',
    presetId: 'cobalt-spot',
    template: 'solid',
    cardRadius: 35,
    brand: {
      tagline: 'Produto · Docs · Comunidade',
      location: 'Cloud · Brasil',
      socialLinks: [
        { network: 'linkedin', url: 'https://linkedin.com/' },
        { network: 'github', url: 'https://github.com/' },
        { network: 'x', url: 'https://x.com/' },
      ],
    },
    sections: [
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Começar grátis',
            subtitle: 'Crie sua conta',
            url: `${SITE}/signup`,
            icon: 'zap',
          },
          {
            type: 'link',
            title: 'Agendar demo',
            subtitle: '15 minutos com o time',
            url: WA,
            icon: 'calendar',
          },
          {
            type: 'link',
            title: 'Documentação',
            subtitle: 'Guias e API',
            url: `${SITE}/docs`,
            icon: 'book',
          },
          {
            type: 'link',
            title: 'Status e suporte',
            subtitle: 'Ajuda e incidentes',
            url: `${SITE}/suporte`,
            icon: 'message',
          },
        ],
      },
    ],
  }),

  pack({
    id: 'rose-pill',
    name: 'Rose Pill',
    niche: 'BELEZA',
    description: 'Salão ou estética: serviços, agenda e catálogo.',
    presetId: 'magenta-dusk',
    template: 'pill',
    cardRadius: 100,
    brand: {
      tagline: 'Beleza · Bem-estar · Autoestima',
      location: 'Salão · Atendimento com hora marcada',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'whatsapp', url: WA },
        { network: 'tiktok', url: 'https://tiktok.com/' },
      ],
    },
    sections: [
      {
        id: 'cta',
        title: 'Agenda',
        hideTitle: true,
        items: [
          {
            type: 'whatsapp-hero',
            badge: 'Horários',
            title: 'Agende seu horário',
            description: 'Cabelo, unhas, estética — diga o que precisa.',
            cta: 'Agendar agora',
            url: WA,
          },
        ],
      },
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Serviços e preços',
            subtitle: 'Tabela completa',
            url: `${SITE}/servicos`,
            icon: 'scissors',
          },
          {
            type: 'link',
            title: 'Antes e depois',
            subtitle: 'Resultados reais',
            url: IG,
            icon: 'camera',
          },
          {
            type: 'link',
            title: 'Produtos à venda',
            subtitle: 'Linha recomendada',
            url: `${SITE}/loja`,
            icon: 'store',
          },
          {
            type: 'location',
            title: 'Onde estamos',
            address: 'Rua da Beleza, 22',
            mapUrl: MAPS,
          },
        ],
      },
    ],
  }),
]

export function resolveThemePack(id?: string): ThemePack | undefined {
  if (!id) return undefined
  return THEME_PACKS.find((packItem) => packItem.id === id)
}

/** Rótulos dos links para o mini preview do card. */
export function getPackPreviewLabels(pack: ThemePack): string[] {
  const labels: string[] = []
  for (const section of pack.snapshot.sections) {
    for (const item of section.items) {
      if (item.type === 'link') labels.push(item.title)
      else if (item.type === 'location') labels.push(item.title)
      else if (item.type === 'whatsapp-hero' || item.type === 'app-hero') {
        labels.push(item.cta || item.title)
      } else if (item.type === 'feature') {
        labels.push(item.title)
      }
      if (labels.length >= 3) return labels
    }
  }
  return labels.length > 0 ? labels : ['WhatsApp', 'Site']
}

/** Aplica só o visual (legado / fine-tuning sem trocar conteúdo). */
export function applyThemePackToBrand(brand: BioBrand, pack: ThemePack): BioBrand {
  return {
    ...brand,
    activeTemplateId: pack.id,
    template: pack.snapshot.template,
    theme: {
      ...brand.theme,
      ...pack.snapshot.theme,
    },
    ...(pack.snapshot.brand?.coverImage !== undefined
      ? { coverImage: pack.snapshot.brand.coverImage }
      : {}),
  }
}

/**
 * Aplica a bio-modelo completa: visual + seções sugestivas.
 * Preserva nome, logo, Instagram handle/url e SEO/footer.
 */
export function applyThemePackToConfig(config: BioConfig, pack: ThemePack): BioConfig {
  const hint = pack.snapshot.brand
  return {
    brand: {
      ...config.brand,
      activeTemplateId: pack.id,
      template: pack.snapshot.template,
      theme: {
        ...config.brand.theme,
        ...pack.snapshot.theme,
      },
      tagline: hint?.tagline ?? config.brand.tagline,
      location: hint?.location ?? config.brand.location,
      coverImage: hint?.coverImage,
      socialLinks: hint?.socialLinks
        ? structuredClone(hint.socialLinks)
        : config.brand.socialLinks,
    },
    sections: structuredClone(pack.snapshot.sections),
  }
}

/** Snapshot neutro — “Criar do zero” (só visual). */
export const BLANK_THEME_SNAPSHOT: ThemePackSnapshot = {
  template: 'classic',
  theme: {
    primary: '#3b82f6',
    secondary: '#93c5fd',
    glow: 'rgba(59, 130, 246, 0.28)',
    background: '#0a0a0a',
    backgroundPreset: undefined,
    backgroundImage: undefined,
    backgroundOverlayOpacity: undefined,
    cardRadius: 50,
  },
  sections: [],
}

export function applyBlankThemeToBrand(brand: BioBrand): BioBrand {
  return {
    ...brand,
    activeTemplateId: undefined,
    template: BLANK_THEME_SNAPSHOT.template,
    theme: {
      ...brand.theme,
      ...BLANK_THEME_SNAPSHOT.theme,
    },
  }
}

/** Extrai snapshot do config atual para salvar como “Meu template”. */
export function extractThemeSnapshot(
  brand: BioBrand,
  sections: BioSection[] = [],
): ThemePackSnapshot {
  return {
    template: brand.template ?? 'classic',
    theme: {
      primary: brand.theme.primary,
      secondary: brand.theme.secondary,
      glow: brand.theme.glow,
      background: brand.theme.background,
      backgroundPreset: brand.theme.backgroundPreset,
      backgroundImage: brand.theme.backgroundImage,
      backgroundOverlayOpacity: brand.theme.backgroundOverlayOpacity,
      cardRadius: brand.theme.cardRadius,
    },
    brand: {
      tagline: brand.tagline,
      location: brand.location,
      coverImage: brand.coverImage,
      socialLinks: brand.socialLinks
        ? structuredClone(brand.socialLinks)
        : undefined,
    },
    sections: structuredClone(sections),
  }
}

/** Aplica snapshot salvo (com ou sem seções — compatível com saves antigos). */
export function applySnapshotToConfig(
  config: BioConfig,
  snapshot: ThemePackSnapshot,
  activeTemplateId?: string,
): BioConfig {
  const hasSections = Array.isArray(snapshot.sections) && snapshot.sections.length > 0
  const hint = snapshot.brand
  return {
    brand: {
      ...config.brand,
      activeTemplateId,
      template: snapshot.template,
      theme: {
        ...config.brand.theme,
        ...snapshot.theme,
      },
      tagline: hint?.tagline ?? config.brand.tagline,
      location: hint?.location ?? config.brand.location,
      coverImage: hint?.coverImage,
      socialLinks: hint?.socialLinks
        ? structuredClone(hint.socialLinks)
        : config.brand.socialLinks,
    },
    sections: hasSections ? structuredClone(snapshot.sections) : config.sections,
  }
}

/** Badges curtas do que o template demonstra (para o card da galeria). */
export function getPackCapabilityLabels(pack: ThemePack): string[] {
  const labels: string[] = []
  const theme = pack.snapshot.theme
  const items = pack.snapshot.sections.flatMap((s) => s.items)

  if (theme.backgroundImage) labels.push('Foto de fundo')
  else if (!theme.backgroundPreset && theme.background) labels.push('Fundo sólido')

  if (pack.snapshot.brand?.coverImage) labels.push('Capa')
  if (items.some((i) => i.type === 'slide')) labels.push('Stories')
  if (items.some((i) => i.type === 'youtube-embed' || i.type === 'video')) labels.push('Vídeo')
  if (items.some((i) => i.type === 'products')) labels.push('Produtos')
  if (items.some((i) => i.type === 'app-hero' || i.type === 'whatsapp-hero')) {
    labels.push('Apps')
  }
  if (
    pack.snapshot.sections.some((s) => s.layout === 'grid-2') ||
    items.some((i) => i.type === 'feature' && i.variant === 'square')
  ) {
    labels.push('Grid')
  }
  if (items.some((i) => 'image' in i && Boolean(i.image))) labels.push('Imagens')

  return labels.slice(0, 4)
}
