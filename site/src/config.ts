/** URLs e contatos comerciais da landing */
export const WHATSAPP_NUMBER = '5519982624408'

const wa = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

export const WHATSAPP_URLS = {
  /** CTA principal do hero e header */
  solicitar: wa('Olá! Quero solicitar minha página profissional para Instagram.'),
  /** Seção problema */
  organizar: wa('Olá! Quero organizar minha bio no Instagram.'),
  /** Pacotes e orçamento */
  orcamento: wa('Olá! Gostaria de solicitar um orçamento.'),
  /** CTA final */
  especialista: wa('Olá! Quero falar com um especialista sobre minha página.'),
  /** Agendar demonstração (sem editor público) */
  demo: wa('Olá! Quero agendar uma demonstração.'),
  /** Legado / compatibilidade */
  default: wa('Olá! Quero saber mais sobre links na bio'),
  proposta: wa('Quero uma proposta do links na bio'),
  valores: wa('Quero saber os valores do links na bio'),
} as const

export const SITE_TITLE = 'Página profissional para Instagram | links na bio'
export const SITE_DESCRIPTION =
  'Criamos sua página profissional para Instagram com hospedagem, suporte e editor simples para atualizações.'

export const INSTAGRAM_URL = 'https://www.instagram.com/instabio'
