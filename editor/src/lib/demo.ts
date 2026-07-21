import type { BioConfig } from '@bio-types'
import demoBioJson from '../../public/demo-bio.json'
import { normalizeBioConfig } from './bio'

export const DEMO_WHATSAPP_URL =
  'https://wa.me/5519982624408?text=' +
  encodeURIComponent('Olá! Testei o editor de demonstração e quero minha bio')

/** Config embutida — evita fetch de /demo-bio.json (em dev o publicDir é bio/public). */
export async function loadDemoConfig(): Promise<BioConfig> {
  return normalizeBioConfig(demoBioJson as BioConfig)
}
