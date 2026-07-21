import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react'
import type { TextAlignment, TextBlock } from '@bio-types'
import { BackgroundFields } from './BackgroundFields'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

const TEXT_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Esquerda', Icon: AlignLeft },
  { value: 'center', label: 'Centralizado', Icon: AlignCenter },
  { value: 'right', label: 'Direita', Icon: AlignRight },
  { value: 'justify', label: 'Justificado', Icon: AlignJustify },
] as const

export function TextItemFields({
  item,
  onChange,
}: {
  item: TextBlock
  onChange: (item: TextBlock) => void
}) {
  return (
    <>
      <FieldGroup title="Formatação">
        <Field label="Alinhamento">
          <div className="grid grid-cols-4 gap-1.5">
            {TEXT_ALIGNMENT_OPTIONS.map(({ value, label, Icon }) => {
              const selected = (item.align ?? 'left') === value
              return (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={`Alinhar texto: ${label}`}
                  aria-pressed={selected}
                  className={`flex min-w-0 items-center justify-center rounded-lg border px-2 py-2 transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                  }`}
                  onClick={() => onChange({ ...item, align: value as TextAlignment })}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Estilo">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'bold', label: 'Negrito', Icon: Bold },
              { key: 'italic', label: 'Itálico', Icon: Italic },
              { key: 'underline', label: 'Sublinhado', Icon: Underline },
            ].map(({ key, label, Icon }) => {
              const selected = Boolean(item[key as 'bold' | 'italic' | 'underline'])
              return (
                <button
                  key={key}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={selected}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                  }`}
                  onClick={() =>
                    onChange({
                      ...item,
                      [key]: !selected,
                    })
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              )
            })}
          </div>
        </Field>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          A cor acompanha automaticamente o contraste definido pelo template.
        </p>
      </FieldGroup>
      <FieldGroup title="Conteúdo">
        <Field label="Texto">
          <textarea
            rows={6}
            maxLength={300}
            value={item.text}
            placeholder="Digite até 300 caracteres"
            onChange={(e) => onChange({ ...item, text: e.target.value.slice(0, 300) })}
          />
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {item.text.length}/300
          </p>
        </Field>
      </FieldGroup>
      <BackgroundFields
        mode={item.backgroundMode}
        color={item.backgroundColor}
        opacity={item.backgroundOpacity}
        defaultMode="transparent"
        onChange={(patch) => onChange({ ...item, ...patch })}
      />
    </>
  )
}
