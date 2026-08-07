import type { BioSection, BioTemplate, SocialLink } from '../types/bio'
import type { ThemePack, ThemePackSnapshot } from './themePacks'

const WA = 'https://wa.me/5511999999999'
const SITE = 'https://exemplo.com'
const MAPS = 'https://maps.google.com'
const IG = 'https://www.instagram.com/'
const YT = 'https://www.youtube.com/'

/**
 * Imagens dos templates showcase.
 * URLs absolutas (Picsum) para funcionar no preview mesmo sem static local.
 * Espelhos em bio/public/assets/templates/ para uso offline/deploy.
 */
const T = {
  cover:
    'https://fastly.picsum.photos/id/1015/900/1100.jpg?hmac=YdRCeuscwspeuXpKly7mPRdE5WegiSEXxH0dZjExmuk',
  event1:
    'https://fastly.picsum.photos/id/1011/800/800.jpg?hmac=_oEN64oSO5QTxNo4OaNj9IvKbU_oygeqeHWw9mo-riA',
  event2:
    'https://fastly.picsum.photos/id/1025/800/800.jpg?hmac=fvdRIVjOccpJuvVsTr3FHnSAeges_Igqa46__zj3Q7U',
  volunteer:
    'https://fastly.picsum.photos/id/1043/1200/700.jpg?hmac=xyYzJkGkLnPLLrWwm8iPdQH37NeuUlJz_p50kvzzNDg',
  bg: 'https://fastly.picsum.photos/id/1036/900/1400.jpg?hmac=gqh-LtJLHLIak5_wIQNLrtj3cojm_mqBmcG7sENIgLg',
  story1:
    'https://fastly.picsum.photos/id/1060/600/900.jpg?hmac=Ot0N65ljDvFlJa2c8boBtBTJ9dQ9-grcjRfdyemfsOs',
  story2:
    'https://fastly.picsum.photos/id/1062/600/900.jpg?hmac=yWd1X2UC1mUyhSHl_-6DDE6uN3zHu0jzcGtuPxgxvl0',
  story3:
    'https://fastly.picsum.photos/id/1074/600/900.jpg?hmac=wUaSQO_8gjJ_0cesbIURUft1sDKCwUva0_hf6vjXASg',
  product1:
    'https://fastly.picsum.photos/id/1080/700/700.jpg?hmac=fW1_Fw5FdSIaR4cIwUpTVnTYcQ3B-ZFF-8CneshYQ5A',
  product2:
    'https://fastly.picsum.photos/id/1084/700/700.jpg?hmac=hRYUONJvHXrZrQgu_iU8dHEbqDkxD7xTBwvUNXi6Ggs',
  cafeCover:
    'https://fastly.picsum.photos/id/1082/900/1100.jpg?hmac=VMRREiMWOGEui5xyrmO1Y8LhM-g8Dek5ZvprxyXXwzM',
  studioBg:
    'https://fastly.picsum.photos/id/1050/900/1400.jpg?hmac=MiKUWfmM3_hTGSyUcL3w47UVWTh_dmz_bCG7vWNE61g',
} as const

function showcase(input: {
  id: string
  name: string
  niche: string
  description: string
  template: BioTemplate
  theme: ThemePackSnapshot['theme']
  brand?: {
    tagline?: string
    location?: string
    socialLinks?: SocialLink[]
    coverImage?: string
  }
  sections: BioSection[]
}): ThemePack {
  return {
    id: input.id,
    name: input.name,
    niche: input.niche,
    description: input.description,
    snapshot: {
      template: input.template,
      theme: input.theme,
      brand: input.brand,
      sections: input.sections,
    },
  }
}

/**
 * Bios-modelo ricas — mostram capa, foto de fundo, grids, stories,
 * heróis de app, YouTube, produtos etc. (estilo referência Expressar).
 */
export const SHOWCASE_THEME_PACKS: ThemePack[] = [
  showcase({
    id: 'igreja-completa',
    name: 'Igreja Completa',
    niche: 'SHOWCASE',
    description:
      'Fundo sólido, banner com foto, WhatsApp, grid de eventos, YouTube e endereço — tudo que o editor faz.',
    template: 'classic',
    theme: {
      primary: '#f97316',
      secondary: '#fdba74',
      glow: 'rgba(249, 115, 22, 0.28)',
      background: '#050505',
      backgroundPreset: undefined,
      backgroundImage: undefined,
      backgroundOverlayOpacity: undefined,
      cardRadius: 40,
    },
    brand: {
      tagline: 'Uma família · Uma fé · Uma missão',
      location: 'Sua cidade · SP',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'youtube', url: YT },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'destaque-evento',
        title: 'Destaque',
        hideTitle: true,
        items: [
          {
            type: 'feature',
            variant: 'portrait',
            badge: 'Gratuito · 20h',
            title: 'Culto de quarta',
            description: 'Venha adorar com a gente',
            cta: 'Quero ir',
            url: WA,
            image: T.cover,
            icon: 'church',
          },
        ],
      },
      {
        id: 'comunidade',
        title: 'Comunidade',
        hideTitle: true,
        items: [
          {
            type: 'app-hero',
            preset: 'whatsapp',
            badge: 'Grupo',
            title: 'Entre na comunidade',
            description: 'Avisos, oração e conexão no WhatsApp.',
            cta: 'Participar',
            url: WA,
            align: 'center',
          },
        ],
      },
      {
        id: 'conecte-se',
        title: 'Conecte-se',
        items: [
          {
            type: 'feature',
            variant: 'gradient',
            badge: 'Novo por aqui?',
            title: 'Cadastro de visitantes',
            description: 'Conte um pouco sobre você — queremos te conhecer.',
            cta: 'Preencher',
            url: `${SITE}/cadastro`,
            icon: 'form',
            gradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
          },
          {
            type: 'link',
            title: 'Área Kids',
            subtitle: 'Programação para as crianças',
            url: `${SITE}/kids`,
            icon: 'baby',
          },
          {
            type: 'link',
            title: 'Pedidos de oração',
            subtitle: 'Estamos juntos nessa',
            url: WA,
            icon: 'pray',
          },
          {
            type: 'link',
            title: 'Seja membro',
            subtitle: 'Dê o próximo passo na fé',
            url: `${SITE}/membros`,
            icon: 'church',
          },
        ],
      },
      {
        id: 'fique-por-dentro',
        title: 'Fique por dentro',
        items: [
          {
            type: 'link',
            title: 'Agenda da semana',
            subtitle: 'Cultos, células e eventos',
            url: `${SITE}/agenda`,
            icon: 'calendar',
          },
          {
            type: 'link',
            title: 'Avisos importantes',
            subtitle: 'Comunicados da igreja',
            url: `${SITE}/avisos`,
            icon: 'bell',
          },
        ],
      },
      {
        id: 'eventos',
        title: 'Eventos',
        layout: 'grid-2',
        items: [
          {
            type: 'feature',
            variant: 'square',
            badge: 'Novos membros',
            title: 'Encontro de integração',
            url: `${SITE}/eventos/integracao`,
            image: T.event1,
            width: 'half',
          },
          {
            type: 'feature',
            variant: 'square',
            badge: 'Juventude',
            title: 'Noite da juventude',
            url: `${SITE}/eventos/juventude`,
            image: T.event2,
            width: 'half',
          },
        ],
      },
      {
        id: 'voluntario',
        title: 'Faça parte',
        hideTitle: true,
        items: [
          {
            type: 'feature',
            variant: 'banner',
            title: 'Seja um voluntário',
            description: 'Use seus dons para servir',
            cta: 'Quero servir',
            url: `${SITE}/voluntarios`,
            image: T.volunteer,
            icon: 'hand-heart',
          },
        ],
      },
      {
        id: 'links-uteis',
        title: 'Links úteis',
        items: [
          {
            type: 'app-hero',
            preset: 'youtube',
            badge: 'Canal',
            title: 'Assista no YouTube',
            description: 'Cultos, mensagens e lives.',
            cta: 'Ver canal',
            url: YT,
          },
          {
            type: 'feature',
            variant: 'compact',
            title: 'Devocionais',
            description: 'Conteúdo diário para fortalecer sua fé',
            url: `${SITE}/devocionais`,
            icon: 'star',
            gradient: 'linear-gradient(135deg, oklch(0.25 0.04 260) 0%, oklch(0.16 0.03 260) 100%)',
          },
          {
            type: 'link',
            title: 'Ofertas e Pix',
            subtitle: 'Contribua com generosidade',
            url: `${SITE}/ofertas`,
            icon: 'heart',
          },
        ],
      },
      {
        id: 'local',
        title: 'Nos encontre',
        items: [
          {
            type: 'location',
            title: 'Templo principal',
            address: 'Rua Exemplo, 100 — Centro',
            mapUrl: MAPS,
          },
        ],
      },
    ],
  }),

  showcase({
    id: 'fundo-foto',
    name: 'Fundo com Foto',
    niche: 'FOTO',
    description: 'Imagem de fundo com overlay, capa no header e cards em soft glass.',
    template: 'glass',
    theme: {
      primary: '#fbbf24',
      secondary: '#fde68a',
      glow: 'rgba(251, 191, 36, 0.3)',
      background: '#0a0a0a',
      backgroundPreset: undefined,
      backgroundImage: T.bg,
      backgroundOverlayOpacity: 0.62,
      cardRadius: 45,
    },
    brand: {
      tagline: 'Atmosfera · Presença · Comunidade',
      location: 'Cultos · Toda semana',
      coverImage: T.cafeCover,
      socialLinks: [
        { network: 'instagram', url: IG },
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
            type: 'app-hero',
            preset: 'whatsapp',
            badge: 'Fale conosco',
            title: 'Tire suas dúvidas',
            description: 'Estamos a uma mensagem de distância.',
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
            title: 'Horários',
            subtitle: 'Programação semanal',
            url: SITE,
            icon: 'calendar',
          },
          {
            type: 'link',
            title: 'Instagram',
            subtitle: 'Bastidores e avisos',
            url: IG,
            icon: 'instagram',
          },
          {
            type: 'feature',
            variant: 'portrait',
            badge: 'Destaque',
            title: 'Próximo encontro',
            description: 'Reserve na agenda',
            url: WA,
            image: T.cover,
          },
        ],
      },
    ],
  }),

  showcase({
    id: 'criador-midia',
    name: 'Criador + Mídia',
    niche: 'STORIES',
    description: 'Stories, YouTube embed, Instagram e grid — ideal para criadores.',
    template: 'soft',
    theme: {
      primary: '#a855f7',
      secondary: '#e9d5ff',
      glow: 'rgba(168, 85, 247, 0.3)',
      background: '#0c0614',
      backgroundPreset: undefined,
      backgroundImage: T.studioBg,
      backgroundOverlayOpacity: 0.7,
      cardRadius: 50,
    },
    brand: {
      tagline: 'Conteúdo · Bastidores · Lançamentos',
      location: 'Online · Mundo',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'tiktok', url: 'https://tiktok.com/' },
        { network: 'youtube', url: YT },
      ],
    },
    sections: [
      {
        id: 'stories',
        title: 'Stories',
        hideTitle: true,
        items: [
          {
            type: 'slide',
            title: 'Bastidores',
            variant: 'portrait',
            autoplay: true,
            slides: [
              { image: T.story1, duration: 4, caption: 'Dia 1' },
              { image: T.story2, duration: 4, caption: 'Dia 2' },
              { image: T.story3, duration: 4, caption: 'Dia 3' },
            ],
          },
        ],
      },
      {
        id: 'redes',
        title: 'Redes',
        hideTitle: true,
        items: [
          {
            type: 'app-hero',
            preset: 'instagram',
            badge: 'Siga',
            title: 'Me acompanhe no Instagram',
            description: 'Posts diários e stories.',
            cta: 'Abrir perfil',
            url: IG,
          },
          {
            type: 'app-hero',
            preset: 'youtube',
            badge: 'Vídeo',
            title: 'Canal no YouTube',
            description: 'Aulas, vlogs e lives.',
            cta: 'Ver canal',
            url: YT,
          },
        ],
      },
      {
        id: 'video',
        title: 'Assista',
        items: [
          {
            type: 'youtube-embed',
            title: 'Vídeo em destaque',
            caption: 'Troque pelo seu vídeo',
            url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
          },
        ],
      },
      {
        id: 'projetos',
        title: 'Projetos',
        layout: 'grid-2',
        items: [
          {
            type: 'feature',
            variant: 'square',
            badge: 'Novo',
            title: 'Lançamento',
            url: SITE,
            image: T.event1,
            width: 'half',
          },
          {
            type: 'feature',
            variant: 'square',
            badge: 'Serie',
            title: 'Bastidores',
            url: SITE,
            image: T.event2,
            width: 'half',
          },
        ],
      },
      {
        id: 'contato',
        title: 'Contato',
        hideTitle: true,
        items: [
          {
            type: 'link',
            title: 'Contrate / collab',
            subtitle: 'Parcerias e orçamentos',
            url: WA,
            icon: 'whatsapp',
          },
        ],
      },
    ],
  }),

  showcase({
    id: 'loja-vitrine',
    name: 'Loja Vitrine',
    niche: 'PRODUTOS',
    description: 'Catálogo com produtos, CTA laranja sólido e links de compra.',
    template: 'solid',
    theme: {
      primary: '#f97316',
      secondary: '#ffedd5',
      glow: 'rgba(249, 115, 22, 0.32)',
      background: '#0a0a0a',
      backgroundPreset: undefined,
      backgroundImage: undefined,
      backgroundOverlayOpacity: undefined,
      cardRadius: 35,
    },
    brand: {
      tagline: 'Produtos · Ofertas · Entrega',
      location: 'Loja online · Brasil',
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'cta',
        title: 'Atendimento',
        hideTitle: true,
        items: [
          {
            type: 'app-hero',
            preset: 'whatsapp',
            badge: 'Pedidos',
            title: 'Peça pelo WhatsApp',
            description: 'Tire dúvidas e finalize seu pedido com a gente.',
            cta: 'Fazer pedido',
            url: WA,
            align: 'center',
          },
        ],
      },
      {
        id: 'vitrine',
        title: 'Vitrine',
        hideTitle: true,
        items: [
          {
            type: 'products',
            title: 'Mais vendidos',
            products: [
              {
                image: T.product1,
                title: 'Produto destaque',
                url: `${SITE}/produto-1`,
                cta: 'Comprar',
              },
              {
                image: T.product2,
                title: 'Produto 2',
                url: `${SITE}/produto-2`,
                cta: 'Comprar',
              },
            ],
          },
        ],
      },
      {
        id: 'links',
        title: 'Loja',
        items: [
          {
            type: 'link',
            title: 'Catálogo completo',
            subtitle: 'Ver todos os itens',
            url: `${SITE}/loja`,
            icon: 'store',
          },
          {
            type: 'link',
            title: 'Promoções',
            subtitle: 'Ofertas da semana',
            url: `${SITE}/promos`,
            icon: 'percent',
          },
          {
            type: 'feature',
            variant: 'banner',
            badge: 'Novidade',
            title: 'Coleção nova',
            description: 'Acabou de chegar',
            cta: 'Ver coleção',
            url: SITE,
            image: T.volunteer,
          },
        ],
      },
    ],
  }),

  showcase({
    id: 'negocio-local',
    name: 'Negócio Local',
    niche: 'LOCAL',
    description: 'Capa, cardápio visual, localização e WhatsApp — para comércio de bairro.',
    template: 'pill',
    theme: {
      primary: '#14b8a6',
      secondary: '#99f6e4',
      glow: 'rgba(20, 184, 166, 0.3)',
      background: '#041110',
      backgroundPreset: undefined,
      backgroundImage: undefined,
      backgroundOverlayOpacity: undefined,
      cardRadius: 100,
    },
    brand: {
      tagline: 'Sabor · Acolhimento · Entrega',
      location: 'Aberto todos os dias · 11h–23h',
      coverImage: T.cafeCover,
      socialLinks: [
        { network: 'instagram', url: IG },
        { network: 'whatsapp', url: WA },
      ],
    },
    sections: [
      {
        id: 'reserva',
        title: 'Reserva',
        hideTitle: true,
        items: [
          {
            type: 'app-hero',
            preset: 'whatsapp',
            badge: 'Mesas',
            title: 'Reserve ou peça delivery',
            description: 'Informe horário e quantidade de pessoas.',
            cta: 'Chamar agora',
            url: WA,
          },
        ],
      },
      {
        id: 'cardapio-visual',
        title: 'Destaques',
        layout: 'grid-2',
        items: [
          {
            type: 'feature',
            variant: 'square',
            badge: 'Chef',
            title: 'Prato do dia',
            url: `${SITE}/cardapio`,
            image: T.event1,
            width: 'half',
          },
          {
            type: 'feature',
            variant: 'square',
            badge: 'Doces',
            title: 'Sobremesas',
            url: `${SITE}/doces`,
            image: T.event2,
            width: 'half',
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
            title: 'Cardápio completo',
            subtitle: 'PDF ou site',
            url: `${SITE}/cardapio`,
            icon: 'utensils',
          },
          {
            type: 'link',
            title: 'Instagram',
            subtitle: 'Novidades do dia',
            url: IG,
            icon: 'instagram',
          },
          {
            type: 'location',
            title: 'Como chegar',
            address: 'Av. Exemplo, 500 — Bairro',
            mapUrl: MAPS,
          },
        ],
      },
    ],
  }),
]
