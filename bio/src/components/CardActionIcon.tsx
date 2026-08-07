import { Check, Copy } from 'lucide-react'
import { useCardAction } from '../lib/cardLink'
import { ArrowIcon, BioIcon } from './icons'

/** Ícone do CTA conforme ação (seta / copiar / formulário / check). */
export function CardActionIcon({ className }: { className?: string }) {
  const { action, copied, interactive } = useCardAction()
  if (!interactive) return null
  if (copied) return <Check className={className} aria-hidden="true" />
  if (action === 'copy') return <Copy className={className} aria-hidden="true" />
  if (action === 'tally') return <BioIcon name="form" className={className} />
  return <ArrowIcon className={className} />
}
