import type { ReactNode } from 'react'
import type { AppHero, AppHeroLayout, IconName, SectionItem, WhatsAppHero } from '@bio-types'
import { APP_HERO_PRESETS } from '@site/lib/appHeroPresets'
import { parseSpotifyEmbed } from '@site/lib/embedUrls'
import {
  APP_HERO_PRESET_LIST,
  APP_HERO_LAYOUTS,
  CARD_TYPES,
  CARD_WIDTH_OPTIONS,
  FEATURE_VARIANTS,
  ICON_LABELS,
  ICON_OPTIONS,
  MEDIA_CARD_VARIANTS,
  resolveHeroLayout,
} from '../lib/bio'
import { GradientField } from './GradientField'
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
    <div className="field">
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

function IconSelect({
  value,
  onChange,
}: {
  value?: IconName
  onChange: (value?: IconName) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value as IconName) || undefined)}
    >
      <option value="">Sem ícone</option>
      {ICON_OPTIONS.map((icon) => (
        <option key={icon} value={icon}>
          {ICON_LABELS[icon] ?? icon}
        </option>
      ))}
    </select>
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
    const next = value.map((tag, i) => (i === index ? { ...tag, ...patch } : tag))
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
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2"
          >
            <input
              className="min-w-0 flex-1"
              value={tag.label}
              placeholder="Texto da tag"
              onChange={(e) => updateTag(index, { label: e.target.value })}
            />
            <div className="w-32 shrink-0 sm:w-40">
              <IconSelect
                value={tag.icon}
                onChange={(icon) => updateTag(index, { icon })}
              />
            </div>
            <button
              type="button"
              className="btn-ghost shrink-0 px-2 py-1 text-xs"
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
      <select
        value={value ?? 'full'}
        onChange={(e) => onChange(e.target.value as 'full' | 'half')}
      >
        {CARD_WIDTH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

  return (
    <>
      <Field label="Layout">
        <select
          value={layout}
          onChange={(e) =>
            onChange({
              ...item,
              layout: e.target.value as AppHeroLayout,
            })
          }
        >
          {layoutOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isGridSection && (
          <p className="mt-1 text-[10px] text-muted-foreground/75">
            Layout completo desativado em grade de 2 colunas.
          </p>
        )}
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
  onFocus,
}: ItemEditorProps) {
  const typeLabel =
    item.type === 'app-hero'
      ? `Destaque · ${APP_HERO_PRESETS[item.preset].label}`
      : item.type === 'whatsapp-hero'
        ? 'WhatsApp destaque'
        : CARD_TYPES.find((t) => t.value === item.type)?.label ?? item.type

  function expandAndFocus() {
    onFocus?.()
    onToggleCollapse?.()
  }

  return (
    <div
      className={`card ${collapsed ? '' : 'space-y-3'} ${onFocus ? 'ring-offset-background' : ''}`}
      onFocusCapture={() => onFocus?.()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={expandAndFocus}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title={collapsed ? 'Expandir' : 'Recolher'}
              aria-expanded={!collapsed}
            >
              <span className="inline-block w-4 text-center text-xs">{collapsed ? '▸' : '▾'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={expandAndFocus}
            className="min-w-0 text-left"
            disabled={!onToggleCollapse}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{typeLabel}</p>
            <p className="truncate font-medium">
              {'title' in item && item.title
                ? item.title
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
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
                      ...(preset === 'custom' ? { icon: APP_HERO_PRESETS.custom.defaultIcon } : {}),
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
                <Field label="Ícone">
                  <IconSelect
                    value={item.icon}
                    onChange={(icon) => onChange({ ...item, icon })}
                  />
                </Field>
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
                <Field label="Ícone">
                  <IconSelect value={item.icon} onChange={(icon) => onChange({ ...item, icon })} />
                </Field>
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
                <Field label="Ícone">
                  <IconSelect value={item.icon} onChange={(icon) => onChange({ ...item, icon })} />
                </Field>
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
