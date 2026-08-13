import type { CardAction } from '@bio-types'
import { parseTallyFormId } from '@site/lib/tally'
import { Field } from './Field'

export const CARD_ACTION_OPTIONS = [
  { value: 'link', label: 'Abrir link' },
  { value: 'copy', label: 'Copiar texto' },
  { value: 'tally', label: 'Formulário Tally (popup)' },
] as const

export function CardActionField({
  value,
  url,
  onChange,
}: {
  value?: CardAction
  url?: string
  onChange: (action: CardAction) => void
}) {
  const action = value ?? 'link'
  const tallyOk = action !== 'tally' || Boolean(parseTallyFormId(url ?? ''))

  return (
    <Field label="Ação do botão">
      <select
        value={action}
        onChange={(e) => onChange(e.target.value as CardAction)}
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
    </Field>
  )
}

export function urlFieldLabel(action?: CardAction): string {
  if (action === 'copy') return 'Texto / URL (opcional)'
  if (action === 'tally') return 'URL do formulário Tally'
  return 'URL (opcional)'
}

export function urlFieldPlaceholder(action?: CardAction): string {
  if (action === 'copy') return 'Chave Pix, texto ou URL — ou use o CTA'
  if (action === 'tally') return 'https://tally.so/r/...'
  return 'Deixe vazio para card sem link'
}
