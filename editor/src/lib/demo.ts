import type { BioConfig } from '@bio-types'
import { normalizeBioConfig } from './bio'

export const DEMO_WHATSAPP_URL =
  'https://wa.me/5519982624408?text=' +
  encodeURIComponent('Olá! Testei o editor de demonstração e quero minha bio')

export async function loadDemoConfig(): Promise<BioConfig> {
  const candidates = [
    `${import.meta.env.BASE_URL}demo-bio.json`,
    '/demo-bio.json',
    '/editor/demo-bio.json',
  ]

  for (const url of candidates) {
    const response = await fetch(url, { cache: 'no-store' })
    if (response.ok) return normalizeBioConfig(await response.json())
  }

  throw new Error('Não foi possível carregar a demonstração')
}
