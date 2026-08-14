import { useEffect, useState } from 'react'
import type { CardAction } from '@bio-types'
import { parseTallyFormId } from '@site/lib/tally'
import { api } from '../../../shared/http'
import { ENDPOINTS } from '../../lib/endpoints'
import { Field } from './Field'

export const CARD_ACTION_OPTIONS = [
  { value: 'link', label: 'Abrir link' },
  { value: 'copy', label: 'Copiar texto' },
  { value: 'tally', label: 'Formulário Tally (popup)' },
  { value: 'page', label: 'Abrir página interna' },
] as const

export type CardActionChange = {
  action: CardAction
  pageSlug?: string
}

type BioPageOption = {
  slug: string
  title: string
  status: string
}

export function CardActionField({
  value,
  url,
  pageSlug,
  onChange,
}: {
  value?: CardAction
  url?: string
  pageSlug?: string
  onChange: (next: CardActionChange) => void
}) {
  const action = value ?? 'link'
  const tallyOk = action !== 'tally' || Boolean(parseTallyFormId(url ?? ''))
  const [pages, setPages] = useState<BioPageOption[]>([])
  const [pagesLoading, setPagesLoading] = useState(false)

  useEffect(() => {
    if (action !== 'page') return

    let cancelled = false
    setPagesLoading(true)
    api<{ pages: BioPageOption[] }>(ENDPOINTS.bioPages)
      .then((data) => {
        if (!cancelled) setPages(data.pages ?? [])
      })
      .catch(() => {
        if (!cancelled) setPages([])
      })
      .finally(() => {
        if (!cancelled) setPagesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [action])

  return (
    <Field label="Ação do botão">
      <select
        value={action}
        onChange={(e) => {
          const next = e.target.value as CardAction
          if (next === 'page') {
            onChange({ action: next, pageSlug: pageSlug ?? '' })
          } else {
            onChange({ action: next, pageSlug: undefined })
          }
        }}
      >
        {CARD_ACTION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {action === 'copy' && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          Copia o texto do botão (CTA), se houver; senão, o campo URL. Para PIX, coloque a
          chave no texto do botão.
        </p>
      )}
      {action === 'tally' && (
        <p
          className={`mt-1.5 text-[11px] leading-snug ${
            tallyOk ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {tallyOk
            ? 'Abre o formulário em popup sem sair da página. Cole a URL do Tally (ex.: https://tally.so/r/XXXX).'
            : 'URL não parece ser do Tally. Use um link como https://tally.so/r/XXXX.'}
        </p>
      )}
      {action === 'page' && (
        <div className="mt-2 space-y-1.5">
          <select
            value={pageSlug ?? ''}
            onChange={(e) => onChange({ action: 'page', pageSlug: e.target.value })}
            disabled={pagesLoading}
          >
            <option value="">
              {pagesLoading ? 'Carregando páginas…' : 'Selecione a página'}
            </option>
            {pages.map((page) => (
              <option key={page.slug} value={page.slug}>
                {page.title}
                {page.status !== 'published' ? ' (rascunho)' : ''}
              </option>
            ))}
          </select>
          {!pagesLoading && pages.length === 0 && (
            <p className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">
              Nenhuma página interna ainda. Crie uma na aba Páginas.
            </p>
          )}
          {!pagesLoading && pages.length > 0 && !pageSlug && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Escolha a página que abre ao clicar no card.
            </p>
          )}
        </div>
      )}
    </Field>
  )
}

export function showsUrlField(action?: CardAction): boolean {
  return (action ?? 'link') !== 'page'
}

export function urlFieldLabel(action?: CardAction): string {
  if (action === 'copy') return 'Texto / URL (opcional)'
  if (action === 'tally') return 'URL do formulário Tally'
  if (action === 'page') return 'Página interna'
  return 'URL (opcional)'
}

export function urlFieldPlaceholder(action?: CardAction): string {
  if (action === 'copy') return 'Chave Pix, texto ou URL — ou use o CTA'
  if (action === 'tally') return 'https://tally.so/r/...'
  if (action === 'page') return 'Selecione a página na ação'
  return 'Deixe vazio para card sem link'
}
