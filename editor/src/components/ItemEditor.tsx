import type { ReactNode } from 'react'
import type {
  AppHero,
  AppHeroLayout,
  FeatureCardAlign,
  IconName,
  ListStyle,
  SectionItem,
  TextAlignment,
  WhatsAppHero,
} from '@bio-types'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CalendarClock,
  Italic,
  Plus,
  Trash2,
  Underline,
} from 'lucide-react'
import { APP_HERO_PRESETS } from '@site/lib/appHeroPresets'
import {
  itemHasScheduleWindow,
  localInputToScheduleIso,
  scheduleIsoToLocalInput,
} from '@site/lib/cardSchedule'
import { parseSpotifyEmbed } from '@site/lib/embedUrls'
import {
  APP_HERO_PRESET_LIST,
  APP_HERO_LAYOUTS,
  CARD_TYPES,
  CARD_WIDTH_OPTIONS,
  FEATURE_ALIGNS,
  FEATURE_VARIANTS,
  MEDIA_CARD_VARIANTS,
  resolveHeroLayout,
} from '../lib/bio'
import { GradientField } from './GradientField'
import { ColorField } from './ColorField'
import { IconPicker } from './IconPicker'
import { ImageField } from './ImageField'
import { ProductsField } from './ProductsField'
import { SlidesField } from './SlidesField'
import { VideoField } from './VideoField'

interface ItemEditorProps {
  item: SectionItem
  isGridSection?: boolean
  onChange: (item: SectionItem) => void
  onRemove: () => void
  onDuplicate?: () => void
  dragHandle?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Abre este card (acordeão) ao clicar no cabeçalho */
  onSelect?: () => void
  onFocus?: () => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="field min-w-0">
      <label>{label}</label>
      {children}
    </div>
  )
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="field-group space-y-3 rounded-lg border border-border/70 bg-muted/15 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

const TEXT_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Esquerda', Icon: AlignLeft },
  { value: 'center', label: 'Centralizado', Icon: AlignCenter },
  { value: 'right', label: 'Direita', Icon: AlignRight },
  { value: 'justify', label: 'Justificado', Icon: AlignJustify },
] as const

const LIST_STYLE_OPTIONS = [
  { value: 'number', label: 'Números', sample: '1.' },
  { value: 'bullet', label: 'Pontos', sample: '•' },
  { value: 'letter', label: 'Letras', sample: 'a.' },
  { value: 'plain', label: 'Simples', sample: '—' },
] as const

type BackgroundMode = 'template' | 'transparent' | 'custom'

function BackgroundFields({
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
            onChange={(event) =>
              onChange({ backgroundOpacity: Number(event.target.value) })
            }
            aria-label="Opacidade do fundo"
          />
        </Field>
      )}
    </FieldGroup>
  )
}

/** Define ou remove o ícone sem deixar `icon: undefined` no objeto. */
function withOptionalIcon<T extends { icon?: IconName }>(item: T, icon?: IconName): T {
  if (icon) return { ...item, icon }
  if (!('icon' in item)) return item
  const { icon: _removed, ...rest } = item
  return rest as T
}

function ScheduleFields({
  item,
  onChange,
}: {
  item: SectionItem
  onChange: (item: SectionItem) => void
}) {
  const enabled = item.schedule !== undefined
  const fromLocal = scheduleIsoToLocalInput(item.schedule?.from)
  const untilLocal = scheduleIsoToLocalInput(item.schedule?.until)
  const rangeInvalid = Boolean(fromLocal && untilLocal) && untilLocal <= fromLocal

  function patchSchedule(next: { from?: string; until?: string } | undefined) {
    if (next === undefined) {
      const { schedule: _s, ...rest } = item as SectionItem & { schedule?: unknown }
      onChange(rest as SectionItem)
      return
    }
    const schedule: { from?: string; until?: string } = {}
    if (next.from) schedule.from = next.from
    if (next.until) schedule.until = next.until
    onChange({ ...item, schedule })
  }

  return (
    <FieldGroup title="Agendamento">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">Agendar exibição</span>
            <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
            Defina quando este card deve aparecer ou sair do ar.
            </span>
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Agendar exibição deste card"
          onClick={() => patchSchedule(enabled ? undefined : {})}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            enabled ? 'border-primary bg-primary/25' : 'border-border bg-muted'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow-sm transition-transform ${
              enabled ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
            }`}
          />
        </button>
      </div>
      {enabled && (
        <div className="space-y-3">
          <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-3">
            <Field label="Aparecer a partir de">
              <input
                type="datetime-local"
                className="min-w-0"
                value={fromLocal}
                onChange={(e) =>
                  patchSchedule({
                    from: localInputToScheduleIso(e.target.value),
                    until: item.schedule?.until,
                  })
                }
              />
            </Field>
            <Field label="Remover em">
              <input
                type="datetime-local"
                className="min-w-0"
                value={untilLocal}
                onChange={(e) =>
                  patchSchedule({
                    from: item.schedule?.from,
                    until: localInputToScheduleIso(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Fuso: America/Sao_Paulo. Se só o início estiver preenchido, o card aparece naquela data e
            permanece até ser removido ou ter data de fim.
          </p>
          {rangeInvalid && (
            <p className="text-[10px] text-red-400">
              A data de remoção deve ser posterior à de início.
            </p>
          )}
          {!fromLocal && !untilLocal && (
            <p className="text-[10px] text-amber-500/90">
              Agendamento ativo sem datas — o card continua visível até preencher início e/ou fim.
            </p>
          )}
        </div>
      )}
    </FieldGroup>
  )
}

type Tag = { label: string; icon?: IconName }

function TagsField({
  value,
  onChange,
}: {
  value: Tag[]
  onChange: (tags: Tag[]) => void
}) {
  function updateTag(index: number, patch: Partial<Tag>) {
    const next = value.map((tag, i) => {
      if (i !== index) return tag
      if ('icon' in patch) return withOptionalIcon({ ...tag, ...patch }, patch.icon)
      return { ...tag, ...patch }
    })
    onChange(next)
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addTag() {
    onChange([...value, { label: '' }])
  }

  return (
    <div className="field">
      <label>Tags</label>
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground/70">Nenhuma tag ainda.</p>
        )}
        {value.map((tag, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <input
                className="w-full"
                value={tag.label}
                placeholder="Texto da tag"
                onChange={(e) => updateTag(index, { label: e.target.value })}
              />
            </div>
            <div className="min-w-0 flex-1 sm:max-w-[11rem]">
              <IconPicker
                bare
                value={tag.icon}
                onChange={(icon) => updateTag(index, { icon })}
              />
            </div>
            <button
              type="button"
              className="btn-ghost shrink-0 self-end px-2 py-1 text-xs sm:mb-0.5"
              onClick={() => removeTag(index)}
              title="Remover tag"
              aria-label="Remover tag"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-secondary mt-2 w-full py-1.5 text-xs"
        onClick={addTag}
      >
        + Adicionar tag
      </button>
    </div>
  )
}

function CardWidthField({
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

function HeroLayoutFields({
  item,
  isGridSection,
  onChange,
}: {
  item: WhatsAppHero | AppHero
  isGridSection: boolean
  onChange: (item: WhatsAppHero | AppHero) => void
}) {
  const layout = resolveHeroLayout(isGridSection, item.layout)
  const layoutOptions = APP_HERO_LAYOUTS.filter(
    (option) => !isGridSection || option.value !== 'default',
  )
  const align = (item.align ?? 'side') as FeatureCardAlign

  return (
    <>
      <Field label="Layout">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {layoutOptions.map((option) => {
            const selected = layout === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 font-semibold text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
                onClick={() =>
                  onChange({
                    ...item,
                    layout: option.value as AppHeroLayout,
                  })
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {isGridSection && (
          <p className="mt-1 text-[10px] text-muted-foreground/75">
            Layout completo desativado em grade de 2 colunas.
          </p>
        )}
      </Field>

      <Field label="Alinhamento">
        <div className="grid grid-cols-2 gap-1.5">
          {FEATURE_ALIGNS.map((option) => {
            const selected = align === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 font-semibold text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
                onClick={() =>
                  onChange({
                    ...item,
                    align: option.value,
                  })
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Field>

      {layout === 'default' && (
        <Field label="Badge">
          <input value={item.badge} onChange={(e) => onChange({ ...item, badge: e.target.value })} />
        </Field>
      )}
      <Field label="Título">
        <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
      </Field>
      {layout === 'default' && (
        <Field label="Descrição">
          <textarea
            rows={2}
            value={item.description}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
      )}
      {layout !== 'condensed' && (
        <Field label="Texto do botão">
          <input value={item.cta} onChange={(e) => onChange({ ...item, cta: e.target.value })} />
        </Field>
      )}
      {(layout === 'compact' || layout === 'condensed') && (
        <p className="text-[10px] text-muted-foreground/75">
          No layout {layout === 'compact' ? 'compacto' : 'condensado'}, badge
          {layout === 'compact' ? ' e descrição' : ', descrição e botão'} não aparecem na bio.
        </p>
      )}
    </>
  )
}

function normalizeSpotifyInput(raw: string): string {
  const parsed = parseSpotifyEmbed(raw)
  if (!parsed) return raw
  if (raw.includes('<iframe')) return raw.trim()
  return parsed.src
}

export function ItemEditor({
  item,
  isGridSection = false,
  onChange,
  onRemove,
  onDuplicate,
  dragHandle,
  collapsed = false,
  onToggleCollapse,
  onSelect,
  onFocus,
}: ItemEditorProps) {
  const typeLabel =
    item.type === 'app-hero'
      ? `Destaque · ${APP_HERO_PRESETS[item.preset].label}`
      : item.type === 'whatsapp-hero'
        ? 'WhatsApp destaque'
        : CARD_TYPES.find((t) => t.value === item.type)?.label ?? item.type

  function selectCard() {
    onFocus?.()
    if (collapsed) onSelect?.()
  }

  return (
    <div
      className={`card min-w-0 ${collapsed ? '' : 'space-y-3'} ${
        !collapsed ? 'ring-1 ring-primary/35' : ''
      }`}
      onFocusCapture={() => onFocus?.()}
    >
      <div
        className={`flex items-center justify-between gap-3 ${
          collapsed ? 'cursor-pointer rounded-lg' : ''
        }`}
        onClick={(e) => {
          if (!collapsed) return
          const target = e.target as HTMLElement
          if (target.closest('button, a, input, select, textarea')) return
          selectCard()
        }}
        onKeyDown={(e) => {
          if (!collapsed) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            selectCard()
          }
        }}
        role={collapsed ? 'button' : undefined}
        tabIndex={collapsed ? 0 : undefined}
      >
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse()
              }}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title={collapsed ? 'Expandir' : 'Recolher'}
              aria-expanded={!collapsed}
            >
              <span className="inline-block w-4 text-center text-xs">{collapsed ? '▸' : '▾'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              selectCard()
            }}
            className="min-w-0 text-left"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{typeLabel}</p>
            <p className="truncate font-medium">
              {'title' in item && item.title
                ? item.title
                : item.type === 'text'
                  ? item.text.trim() || 'Texto'
                  : item.type === 'list'
                    ? item.items.find((entry) => entry.trim())?.trim() || 'Lista'
                    : item.type === 'video'
                      ? 'Vídeo'
                      : item.type === 'slide'
                        ? 'Slides'
                        : item.type === 'products'
                          ? 'Produtos'
                          : item.type === 'youtube-embed'
                            ? 'YouTube'
                            : item.type === 'spotify-embed'
                              ? 'Spotify'
                              : item.type}
            </p>
            {(item.schedule !== undefined || itemHasScheduleWindow(item)) && (
              <p className="mt-0.5 text-[10px] font-medium text-primary">
                {itemHasScheduleWindow(item) ? 'Agendado' : 'Agendamento (sem datas)'}
              </p>
            )}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onDuplicate && (
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              onClick={onDuplicate}
            >
              Clonar
            </button>
          )}
          <button
            type="button"
            className="btn-danger shrink-0 px-3 py-1.5 text-xs"
            onClick={onRemove}
          >
            Remover
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <>
          <ScheduleFields item={item} onChange={onChange} />

          {'url' in item &&
            item.type !== 'video' &&
            item.type !== 'youtube-embed' &&
            item.type !== 'spotify-embed' && (
              <Field label="URL (opcional)">
                <input
                  value={item.url}
                  onChange={(e) => onChange({ ...item, url: e.target.value } as SectionItem)}
                  placeholder="Deixe vazio para card sem link"
                />
              </Field>
            )}

          {item.type === 'text' && (
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
          )}

          {item.type === 'list' && (
            <>
              <FieldGroup title="Conteúdo">
                <Field label="Título (opcional)">
                  <input
                    maxLength={80}
                    value={item.title ?? ''}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                  />
                </Field>
                <Field label="Formato da lista">
                  <div className="grid grid-cols-4 gap-1.5">
                    {LIST_STYLE_OPTIONS.map(({ value, label, sample }) => {
                      const selected = (item.style ?? 'bullet') === value
                      return (
                        <button
                          key={value}
                          type="button"
                          title={label}
                          aria-label={`Formato: ${label}`}
                          aria-pressed={selected}
                          className={`rounded-lg border px-1.5 py-2 text-center transition-colors ${
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                          }`}
                          onClick={() => onChange({ ...item, style: value as ListStyle })}
                        >
                          <span className="block text-sm font-bold leading-none">{sample}</span>
                          <span className="mt-1 block truncate text-[9px]">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </Field>

                <div className="field min-w-0">
                  <label>Itens</label>
                  <div className="space-y-2">
                    {item.items.map((entry, index) => (
                      <div key={index} className="flex min-w-0 items-center gap-2">
                        <span className="w-5 shrink-0 text-right text-xs font-semibold text-primary">
                          {item.style === 'number'
                            ? `${index + 1}.`
                            : item.style === 'letter'
                              ? `${String.fromCharCode(97 + (index % 26))}.`
                              : item.style === 'plain'
                                ? '—'
                                : '•'}
                        </span>
                        <input
                          className="min-w-0 flex-1"
                          maxLength={160}
                          value={entry}
                          placeholder={`Item ${index + 1}`}
                          onChange={(e) => {
                            const items = [...item.items]
                            items[index] = e.target.value
                            onChange({ ...item, items })
                          }}
                        />
                        <button
                          type="button"
                          className="btn-ghost shrink-0 p-2 text-muted-foreground hover:text-red-400"
                          aria-label={`Remover item ${index + 1}`}
                          title="Remover item"
                          onClick={() =>
                            onChange({
                              ...item,
                              items: item.items.filter((_, itemIndex) => itemIndex !== index),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs"
                    onClick={() => onChange({ ...item, items: [...item.items, ''] })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar item
                  </button>
                </div>
              </FieldGroup>

              <BackgroundFields
                mode={item.backgroundMode}
                color={item.backgroundColor}
                opacity={item.backgroundOpacity}
                defaultMode="template"
                onChange={(patch) => onChange({ ...item, ...patch })}
              />
            </>
          )}

          {item.type === 'whatsapp-hero' && (
            <HeroLayoutFields
              item={item}
              isGridSection={isGridSection}
              onChange={(updated) => onChange(updated)}
            />
          )}

          {item.type === 'app-hero' && (
            <>
              <Field label="App">
                <select
                  value={item.preset}
                  onChange={(e) => {
                    const preset = e.target.value as typeof item.preset
                    const defaults = APP_HERO_PRESETS[preset].defaults
                    onChange({
                      ...item,
                      preset,
                      ...defaults,
                      layout: item.layout,
                      align: item.align,
                      ...(preset === 'custom'
                        ? { icon: APP_HERO_PRESETS.custom.defaultIcon }
                        : {}),
                    })
                  }}
                >
                  {APP_HERO_PRESET_LIST.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </Field>
              {item.preset === 'custom' && (
                <IconPicker
                  value={item.icon}
                  onChange={(icon) => onChange(withOptionalIcon(item, icon))}
                />
              )}
              <HeroLayoutFields
                item={item}
                isGridSection={isGridSection}
                onChange={(updated) => onChange(updated)}
              />
            </>
          )}

          {item.type === 'feature' && (
            <>
              <FieldGroup title="Layout">
                <Field label="Formato">
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {FEATURE_VARIANTS.map((variant) => {
                      const selected = (item.variant ?? 'gradient') === variant.value
                      return (
                        <button
                          key={variant.value}
                          type="button"
                          className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                            selected
                              ? 'border-primary bg-primary/10 font-semibold text-foreground'
                              : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                          }`}
                          onClick={() =>
                            onChange({
                              ...item,
                              variant: variant.value as typeof item.variant,
                            })
                          }
                        >
                          {variant.label}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                {(item.variant ?? 'gradient') === 'gradient' && (
                  <Field label="Alinhamento">
                    <div className="grid grid-cols-2 gap-1.5">
                      {FEATURE_ALIGNS.map((option) => {
                        const selected = (item.align ?? 'side') === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                              selected
                                ? 'border-primary bg-primary/10 font-semibold text-foreground'
                                : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                            }`}
                            onClick={() =>
                              onChange({
                                ...item,
                                align: option.value,
                              })
                            }
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                )}
                <CardWidthField
                  value={item.width}
                  isGridSection={isGridSection}
                  onChange={(width) => onChange({ ...item, width })}
                />
              </FieldGroup>

              <FieldGroup title="Conteúdo">
                <Field label="Badge">
                  <input
                    value={item.badge ?? ''}
                    onChange={(e) => onChange({ ...item, badge: e.target.value })}
                  />
                </Field>
                <Field label="Título">
                  <input
                    value={item.title}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    rows={2}
                    value={item.description ?? ''}
                    onChange={(e) => onChange({ ...item, description: e.target.value })}
                  />
                </Field>
                <Field label="Texto do botão">
                  <input
                    value={item.cta ?? ''}
                    onChange={(e) => onChange({ ...item, cta: e.target.value })}
                  />
                </Field>
              </FieldGroup>

              <FieldGroup title="Mídia e estilo">
                <IconPicker
                  value={item.icon}
                  onChange={(icon) => onChange(withOptionalIcon(item, icon))}
                />
                <ImageField
                  label="Imagem (retrato / banner)"
                  value={item.image}
                  onChange={(image) => onChange({ ...item, image })}
                />
                {['gradient', 'square'].includes(item.variant ?? 'gradient') && (
                  <GradientField
                    label="Cor do card (usada sem imagem)"
                    value={item.gradient}
                    onChange={(gradient) => onChange({ ...item, gradient })}
                  />
                )}
                {['banner', 'portrait'].includes(item.variant ?? '') && (
                  <TagsField
                    value={item.tags ?? []}
                    onChange={(tags) => onChange({ ...item, tags })}
                  />
                )}
              </FieldGroup>
            </>
          )}

          {item.type === 'link' && (
            <>
              <FieldGroup title="Layout">
                <CardWidthField
                  value={item.width}
                  isGridSection={isGridSection}
                  onChange={(width) => onChange({ ...item, width })}
                />
              </FieldGroup>
              <FieldGroup title="Conteúdo">
                <Field label="Título">
                  <input
                    value={item.title}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                  />
                </Field>
                <Field label="Subtítulo">
                  <input
                    value={item.subtitle ?? ''}
                    onChange={(e) => onChange({ ...item, subtitle: e.target.value })}
                  />
                </Field>
                <IconPicker
                  value={item.icon}
                  onChange={(icon) => onChange(withOptionalIcon(item, icon))}
                />
              </FieldGroup>
            </>
          )}

          {item.type === 'video' && (
            <>
              <FieldGroup title="Mídia">
                <VideoField
                  label="Vídeo"
                  value={item.video}
                  onChange={(video) => onChange({ ...item, video: video ?? '' })}
                  hint="MP4 recomendado. Tamanho máximo ~25 MB."
                />
                <ImageField
                  label="Capa (opcional)"
                  value={item.poster}
                  onChange={(poster) => onChange({ ...item, poster })}
                  hint="Imagem exibida antes do vídeo carregar."
                />
                <Field label="Formato">
                  <select
                    value={item.variant ?? 'portrait'}
                    onChange={(e) =>
                      onChange({
                        ...item,
                        variant: e.target.value as typeof item.variant,
                      })
                    }
                  >
                    {MEDIA_CARD_VARIANTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>
              <FieldGroup title="Conteúdo">
                <Field label="Título (opcional)">
                  <input
                    value={item.title ?? ''}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                  />
                </Field>
                <Field label="Descrição (opcional)">
                  <textarea
                    rows={2}
                    value={item.description ?? ''}
                    onChange={(e) => onChange({ ...item, description: e.target.value })}
                  />
                </Field>
                <Field label="Link ao clicar (opcional)">
                  <input
                    value={item.url ?? ''}
                    onChange={(e) => onChange({ ...item, url: e.target.value || undefined })}
                    placeholder="https://"
                  />
                </Field>
              </FieldGroup>
            </>
          )}

          {item.type === 'slide' && (
            <>
              <FieldGroup title="Layout">
                <Field label="Formato">
                  <select
                    value={item.variant ?? 'portrait'}
                    onChange={(e) =>
                      onChange({
                        ...item,
                        variant: e.target.value as typeof item.variant,
                      })
                    }
                  >
                    {MEDIA_CARD_VARIANTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Avançar automaticamente">
                  <select
                    value={item.autoplay === false ? 'false' : 'true'}
                    onChange={(e) => onChange({ ...item, autoplay: e.target.value === 'true' })}
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não — apenas ao tocar</option>
                  </select>
                </Field>
              </FieldGroup>
              <FieldGroup title="Conteúdo">
                <Field label="Título do conjunto (opcional)">
                  <input
                    value={item.title ?? ''}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                    placeholder="Ex.: Destaques"
                  />
                </Field>
                <SlidesField
                  slides={item.slides}
                  onChange={(slides) => onChange({ ...item, slides })}
                />
              </FieldGroup>
            </>
          )}

          {item.type === 'products' && (
            <>
              <Field label="Título da galeria (opcional)">
                <input
                  value={item.title ?? ''}
                  onChange={(e) => onChange({ ...item, title: e.target.value })}
                  placeholder="Ex.: Nossa loja"
                />
              </Field>
              <ProductsField
                products={item.products}
                onChange={(products) => onChange({ ...item, products })}
              />
            </>
          )}

          {item.type === 'youtube-embed' && (
            <>
              <Field label="Link do vídeo no YouTube">
                <input
                  value={item.url}
                  onChange={(e) => onChange({ ...item, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </Field>
              <Field label="Título (opcional)">
                <input
                  value={item.title ?? ''}
                  onChange={(e) => onChange({ ...item, title: e.target.value })}
                />
              </Field>
              <p className="text-[10px] text-muted-foreground/75">
                Aceita links de vídeo, Shorts ou youtu.be. O player aparece embutido na bio.
              </p>
            </>
          )}

          {item.type === 'spotify-embed' && (
            <>
              <Field label="Link do Spotify">
                <input
                  value={
                    (item.embed ?? item.url ?? '').includes('<iframe')
                      ? ''
                      : (item.embed ?? item.url ?? '')
                  }
                  onChange={(e) =>
                    onChange({
                      ...item,
                      embed: normalizeSpotifyInput(e.target.value),
                      url: undefined,
                      theme: undefined,
                      size: undefined,
                    })
                  }
                  placeholder="https://open.spotify.com/playlist/..."
                />
              </Field>
              <details className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2">
                <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
                  Ou cole o código de incorporação (iframe)
                </summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    value={item.embed ?? item.url ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...item,
                        embed: e.target.value,
                        url: undefined,
                        theme: undefined,
                        size: undefined,
                      })
                    }
                    rows={4}
                    placeholder={'<iframe ... src="https://open.spotify.com/embed/..." ...></iframe>'}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground/75">
                    No Spotify: Compartilhar → Incorporar → copie o iframe. Playlist, álbum, artista
                    ou música.
                  </p>
                </div>
              </details>
              <Field label="Título (opcional)">
                <input
                  value={item.title ?? ''}
                  onChange={(e) => onChange({ ...item, title: e.target.value })}
                />
              </Field>
              <p className="text-[10px] text-muted-foreground/75">
                Cole o link público da playlist, álbum ou música — o player aparece embutido na bio.
              </p>
            </>
          )}

          {item.type === 'grid' && (
            <>
              <Field label="Badge">
                <input
                  value={item.badge ?? ''}
                  onChange={(e) => onChange({ ...item, badge: e.target.value })}
                />
              </Field>
              <Field label="Título">
                <input
                  value={item.title}
                  onChange={(e) => onChange({ ...item, title: e.target.value })}
                />
              </Field>
              <Field label="Subtítulo">
                <input
                  value={item.subtitle ?? ''}
                  onChange={(e) => onChange({ ...item, subtitle: e.target.value })}
                />
              </Field>
              <ImageField
                label="Imagem"
                value={item.image}
                onChange={(image) => onChange({ ...item, image })}
              />
              <GradientField
                label="Cor do card (usada sem imagem)"
                value={item.gradient}
                onChange={(gradient) => onChange({ ...item, gradient })}
              />
            </>
          )}

          {item.type === 'location' && (
            <>
              <Field label="Título">
                <input
                  value={item.title}
                  onChange={(e) => onChange({ ...item, title: e.target.value })}
                />
              </Field>
              <Field label="Endereço">
                <input
                  value={item.address}
                  onChange={(e) => onChange({ ...item, address: e.target.value })}
                />
              </Field>
              <Field label="URL do mapa">
                <input
                  value={item.mapUrl}
                  onChange={(e) => onChange({ ...item, mapUrl: e.target.value })}
                />
              </Field>
            </>
          )}
        </>
      )}
    </div>
  )
}
