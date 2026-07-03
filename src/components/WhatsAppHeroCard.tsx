import type { WhatsAppHero } from '../types/bio'
import { AppHeroCard } from './AppHeroCard'

/** @deprecated Use AppHeroCard — mantido para compatibilidade com bio.json antigo */
export function WhatsAppHeroCard({ item }: { item: WhatsAppHero }) {
  return <AppHeroCard item={item} />
}
