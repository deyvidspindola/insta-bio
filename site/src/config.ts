/** URLs e contatos comerciais da landing */
export const WHATSAPP_NUMBER = '5519982624408'

export const DEMO_URL = import.meta.env.DEV
  ? 'http://localhost:5180/demo.html'
  : '/demo'

export const WHATSAPP_URLS = {
  default: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Quero saber mais sobre links na bio')}`,
  proposta: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quero uma proposta do links na bio')}`,
  valores: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quero saber os valores do links na bio')}`,
  demo: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quero ver uma demonstração')}`,
} as const

export const INSTAGRAM_URL = 'https://www.instagram.com/instabio'
