import { CARD_WIDTH_OPTIONS } from '../../lib/bio'
import { Field } from './Field'

export function CardWidthField({
  value,
  onChange,
  isGridSection,
}: {
  value?: 'full' | 'half'
  onChange: (width: 'full' | 'half') => void
  isGridSection: boolean
}) {
  return (
    <Field label="Largura do card">
      <div className="grid grid-cols-2 gap-1.5">
        {CARD_WIDTH_OPTIONS.map((option) => {
          const selected = (value ?? 'full') === option.value
          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 font-semibold text-foreground'
                  : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
              }`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/75">
        {isGridSection
          ? 'Na grade da seção, “largura total” ocupa as 2 colunas.'
          : '“Metade” coloca 2 cards lado a lado na mesma linha.'}
      </p>
    </Field>
  )
}
