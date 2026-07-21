import { ColorField } from '../ColorField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export type BackgroundMode = 'template' | 'transparent' | 'custom'

export function BackgroundFields({
  mode,
  color,
  opacity,
  defaultMode,
  onChange,
}: {
  mode?: BackgroundMode
  color?: string
  opacity?: number
  defaultMode: BackgroundMode
  onChange: (patch: {
    backgroundMode?: BackgroundMode
    backgroundColor?: string
    backgroundOpacity?: number
  }) => void
}) {
  const resolvedMode = mode ?? defaultMode
  const resolvedOpacity = Math.max(0, Math.min(100, opacity ?? 100))

  return (
    <FieldGroup title="Aparência">
      <Field label="Fundo">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'template', label: 'Template' },
            { value: 'transparent', label: 'Sem fundo' },
            { value: 'custom', label: 'Personalizado' },
          ].map((option) => {
            const selected = resolvedMode === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                className={`rounded-lg border px-2 py-2 text-[10px] font-medium transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
                onClick={() =>
                  onChange({
                    backgroundMode: option.value as BackgroundMode,
                  })
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Field>

      {resolvedMode === 'custom' && (
        <ColorField
          label="Cor personalizada"
          value={color ?? '#1f2937'}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
          hint="A cor do texto é ajustada automaticamente para manter o contraste."
        />
      )}

      {resolvedMode !== 'transparent' && (
        <Field label={`Opacidade do fundo: ${Math.round(resolvedOpacity)}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={resolvedOpacity}
            onChange={(event) => onChange({ backgroundOpacity: Number(event.target.value) })}
            aria-label="Opacidade do fundo"
          />
        </Field>
      )}
    </FieldGroup>
  )
}
