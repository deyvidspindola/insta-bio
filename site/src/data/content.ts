/** Conteúdo estático da landing — edite aqui. */

export const WHATSAPP_NUMBER = '5519982624408'

const wa = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

export const LINKS = {
  cta: wa('Olá! Quero ativar minha vitrine no Instagram.'),
  demo: wa('Olá! Quero agendar uma demonstração.'),
  support: wa('Olá! Tem dúvidas? Quero falar com um especialista.'),
  login: '/panel/',
  instagram: 'https://www.instagram.com/instabio',
  terms: wa('Olá! Gostaria de receber os termos de uso.'),
  privacy: wa('Olá! Gostaria de receber a política de privacidade.'),
} as const

export const NAV = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Editor', href: '#editor' },
  { label: 'Planos', href: '#planos' },
  { label: 'Clientes', href: '#clientes' },
] as const

export const HERO_BADGES = [
  { label: 'Carregamento em 0.4s', icon: '⚡' },
  { label: 'Analytics integrado', icon: '📊' },
  { label: 'WhatsApp Direct', icon: '📲' },
] as const

export type PortfolioItem = {
  name: string
  category: string
  image: string
}

/** Prints reais de bio — substitua por fotos de clientes quando tiver. */
export const PORTFOLIO: PortfolioItem[] = [
  {
    name: 'Saúde & Estética',
    category: 'Clínicas, dentistas, esteticistas',
    image: '/images/product-bio-mobile.png',
  },
  {
    name: 'Serviços executivos',
    category: 'Advogados, contadores, arquitetos',
    image: '/images/product-bio-full.png',
  },
  {
    name: 'Comércio & serviços',
    category: 'Lojas, óticas, prestadores',
    image: '/images/product-bio-mobile.png',
  },
]

export const COMPARE = {
  bad: {
    title: 'Com link genérico',
    items: [
      'Visual amador e igual ao de milhares de perfis',
      'Lento para carregar no 4G do cliente',
      'Muitos links confusos que fazem desistir',
      'Transmite falta de profissionalismo',
    ],
  },
  good: {
    title: 'Com sua página exclusiva',
    items: [
      'Identidade visual com as cores da sua marca',
      'Carregamento instantâneo',
      'Foco no botão de agendamento e orçamento',
      'Confiança imediata para fechar vendas',
    ],
  },
} as const

export const PLAN = {
  name: 'Profissional',
  badge: 'Mais escolhido',
  setupLabel: 'Ativação & configuração inicial',
  setup: 'R$ 147',
  monthlyLabel: 'Licença da plataforma + hospedagem',
  monthly: 'R$ 29',
  features: [
    'Plataforma com editor visual em tempo real',
    'Configuração VIP realizada em até 24h úteis',
    'Botões otimizados para alta conversão no WhatsApp',
    'Domínio próprio incluso — conecte o seu ou escolha um link personalizado da plataforma',
    'Sem fidelidade — cancele quando quiser',
  ],
  guarantee:
    'Garantia de satisfação: teste por 7 dias. Se não amar o resultado da sua vitrine, devolvemos 100% do valor de ativação.',
  ctaLabel: 'Quero ativar minha vitrine',
  ctaHref: wa('Olá! Quero ativar minha vitrine — plano Profissional.'),
} as const

export const STEPS = [
  {
    n: '1',
    title: 'Escolha seu modelo & envie as informações',
    text: 'Envie suas fotos, links e cores pelo nosso formulário rápido.',
  },
  {
    n: '2',
    title: 'Ativação & otimização profissional',
    text: 'Sua vitrine é configurada, otimizada e publicada em até 24h.',
  },
  {
    n: '3',
    title: 'Autonomia total no seu painel',
    text: 'Bio pronta para vender no Instagram, com editor para alterar qualquer item em segundos.',
  },
] as const

export const FAQ_ITEMS = [
  {
    q: 'O que cobrem os R$ 147 e os R$ 29/mês?',
    a: 'Os R$ 147 são a ativação e configuração inicial (pagamento único). Os R$ 29/mês são a licença da plataforma: hospedagem ultra rápida, editor visual e atualizações. Sem fidelidade.',
  },
  {
    q: 'Quanto tempo leva a ativação?',
    a: 'Sua vitrine fica no ar em até 24 horas úteis após o envio das informações.',
  },
  {
    q: 'Preciso saber editar site?',
    a: 'Não. A configuração VIP já deixa tudo pronto. Depois você altera textos, fotos e botões pelo editor — em segundos, no celular ou no computador.',
  },
  {
    q: 'Posso usar meu próprio domínio?',
    a: 'Com certeza! Você pode conectar o domínio da sua empresa (ex: link.suamarca.com.br) sem nenhum custo extra. Caso ainda não tenha um domínio, fornecemos um link curto e profissional pronto para usar — a configuração é simplificada na ativação.',
  },
  {
    q: 'E se eu já uso outra página de links?',
    a: 'Migramos o essencial na ativação. Você só troca o link na bio do Instagram.',
  },
  {
    q: 'Como funciona a garantia?',
    a: 'Você tem 7 dias para testar. Se não amar o resultado, devolvemos 100% do valor de ativação.',
  },
] as const
