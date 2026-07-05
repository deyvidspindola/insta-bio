import { useState } from 'react'
import type { BioBrand, BioTemplate } from '@bio-types'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { BACKGROUND_PRESETS } from '@site/lib/backgroundPresets'
import { BIO_TEMPLATE_LIST, DEFAULT_BIO_TEMPLATE } from '@site/lib/templates'
import {
  cardRadiusLabel,
  resolveCardRadius,
  resolveCardRadiusPx,
} from '@site/lib/cardRadius'
import { COLOR_PALETTES, type ColorPalette } from '../lib/colorPalettes'
import { extractPaletteFromImage, type ExtractedPalette } from '../lib/extractImagePalette'
import { ColorField, GlowColorField } from './ColorField'
import { ImageField } from './ImageField'

interface BrandFormProps {
  brand: BioBrand
  onChange: (brand: BioBrand) => void
}

function update<K extends keyof BioBrand>(brand: BioBrand, key: K, value: BioBrand[K]) {
  return { ...brand, [key]: value }
}

export function BrandForm({ brand, onChange }: BrandFormProps) {
  const activeTemplate = brand.template ?? DEFAULT_BIO_TEMPLATE
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [imagePalette, setImagePalette] = useState<ExtractedPalette | null>(null)

  function setTemplate(template: BioTemplate) {
    onChange({ ...brand, template })
  }

  function applyThemeColors(colors: {
    primary: string
    secondary: string
    glow: string
  }) {
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        primary: colors.primary,
        secondary: colors.secondary,
        glow: colors.glow,
      },
    })
  }

  function applyPalette(palette: ColorPalette) {
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        primary: palette.primary,
        secondary: palette.secondary,
        background: brand.theme.backgroundImage ? brand.theme.background : palette.background,
        glow: palette.glow,
      },
    })
  }

  async function suggestColorsFromBackground(
    imagePath?: string,
    baseBrand: BioBrand = brand,
  ) {
    const path = imagePath ?? baseBrand.theme.backgroundImage
    if (!path) return

    setExtracting(true)
    setExtractError(null)
    try {
      const palette = await extractPaletteFromImage(resolvePublicUrl(path))
      setImagePalette(palette)
      onChange({
        ...baseBrand,
        theme: {
          ...baseBrand.theme,
          primary: palette.primary,
          secondary: palette.secondary,
          glow: palette.glow,
        },
      })
    } catch {
      setExtractError('Não foi possível ler as cores da imagem. Tente salvar e recarregar.')
    } finally {
      setExtracting(false)
    }
  }

  function applyBackgroundPreset(presetId: string) {
    const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        backgroundPreset: presetId,
        backgroundImage: undefined,
        background: preset.edgeColor,
        primary: preset.primary,
        secondary: preset.secondary,
        glow: preset.glow,
      },
    })
    setImagePalette(null)
    setExtractError(null)
  }

  function clearBackgroundPreset() {
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        backgroundPreset: undefined,
      },
    })
  }

  const hasBgImage = Boolean(brand.theme.backgroundImage)
  const activeBgPreset = brand.theme.backgroundPreset
  const activePreset = BACKGROUND_PRESETS.find((preset) => preset.id === activeBgPreset)
  const cardRadius = resolveCardRadius(brand.theme.cardRadius)
  const cardRadiusPx = resolveCardRadiusPx(brand.theme.cardRadius)

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold">Identidade</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <label>Nome</label>
            <input
              value={brand.name}
              onChange={(e) => onChange(update(brand, 'name', e.target.value))}
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Tagline</label>
            <input
              value={brand.tagline ?? ''}
              onChange={(e) => onChange(update(brand, 'tagline', e.target.value))}
            />
          </div>
          <div className="field">
            <label>Localização</label>
            <input
              value={brand.location}
              onChange={(e) => onChange(update(brand, 'location', e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Logo"
              value={brand.logo}
              onChange={(logo) => onChange(update(brand, 'logo', logo ?? ''))}
            />
          </div>
          <div className="field">
            <label>Instagram @</label>
            <input
              value={brand.instagram.handle}
              onChange={(e) =>
                onChange({
                  ...brand,
                  instagram: { ...brand.instagram, handle: e.target.value },
                })
              }
            />
          </div>
          <div className="field">
            <label>Instagram URL</label>
            <input
              value={brand.instagram.url}
              onChange={(e) =>
                onChange({
                  ...brand,
                  instagram: { ...brand.instagram, url: e.target.value },
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Capa do topo (banner)"
              value={brand.coverImage}
              onChange={(coverImage) => onChange(update(brand, 'coverImage', coverImage))}
              hint="Banner horizontal acima do logo. Opcional."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Estilo dos links simples</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Templates visuais para cards do tipo <strong className="font-medium text-foreground/90">Link simples</strong>{' '}
          (e localização). Não alteram cards destaque (WhatsApp/YouTube), cards com imagem ou gradiente —
          estes têm layout próprio na seção.
        </p>

        <div className="mb-4 rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/85">O que cada controle afeta:</span>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            <li>
              <span className="text-foreground/75">Templates abaixo</span> → links simples e localização
            </li>
            <li>
              <span className="text-foreground/75">Arredondamento</span> → links, localização, destaques e cards com imagem
            </li>
            <li>
              <span className="text-foreground/75">Layout compacto/condensado</span> → só cards destaque, na configuração da seção
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BIO_TEMPLATE_LIST.map((item) => {
            const selected = activeTemplate === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTemplate(item.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border bg-background/40 hover:border-primary/40'
                }`}
              >
                <div className={`bio-tpl-preview ${item.previewClass} mb-2`}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className="block text-xs font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-xs font-medium">Arredondamento</label>
            <span className="text-[10px] text-muted-foreground">
              {cardRadiusLabel(cardRadius)} · {cardRadiusPx}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cardRadius}
            onChange={(e) =>
              onChange({
                ...brand,
                theme: {
                  ...brand.theme,
                  cardRadius: Number(e.target.value),
                },
              })
            }
            className="color-opacity-slider w-full"
            aria-label="Arredondamento dos cards"
          />
          <div className="mt-3 flex items-end gap-2">
            {[0, 35, 70, 100].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() =>
                  onChange({
                    ...brand,
                    theme: { ...brand.theme, cardRadius: step },
                  })
                }
                className={`flex h-10 flex-1 items-center justify-center border transition-colors ${
                  cardRadius === step
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background/40 hover:border-primary/35'
                }`}
                style={{ borderRadius: resolveCardRadiusPx(step) }}
                title={cardRadiusLabel(step)}
              >
                <span className="sr-only">{cardRadiusLabel(step)}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground/75">
            Afeta cantos de links, localização, destaques e cards com imagem. No estilo Pill, coluna única vira pílula; em 2 colunas fica retangular arredondado.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Fundo e cores</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Paleta, imagem de fundo e cores da página.
        </p>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-foreground/90">Sugestões por perfil</p>
          <p className="mb-3 text-[10px] text-muted-foreground/80">
            Paletas prontas para igreja, confeitaria, barbearia, saúde e outros.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => applyPalette(palette)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background/30 px-2.5 py-2 text-left transition-colors hover:border-primary/45 hover:bg-primary/5"
                title={`Aplicar paleta ${palette.name}`}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-md border border-border/60 shadow-inner"
                  style={{ background: palette.swatch }}
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold leading-tight">{palette.name}</span>
                  {palette.tag && (
                    <span className="block text-[9px] text-muted-foreground">{palette.tag}</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {hasBgImage && (
            <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-3">
              <p className="text-[11px] font-medium text-foreground/90">Cores da sua imagem de fundo</p>
              <p className="mt-1 text-[10px] text-muted-foreground/80">
                Analisa a foto e ajusta primária, secundária e brilho para contrastar com o fundo.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  disabled={extracting}
                  onClick={() => suggestColorsFromBackground()}
                >
                  {extracting ? 'Analisando…' : 'Sugerir cores do fundo'}
                </button>
                {imagePalette && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1 text-[10px] hover:border-primary/40"
                    onClick={() => applyThemeColors(imagePalette)}
                    title="Reaplicar cores extraídas da imagem"
                  >
                    <span
                      className="h-5 w-5 rounded border border-border/60"
                      style={{ background: imagePalette.swatch }}
                    />
                    Da imagem
                  </button>
                )}
              </div>
              {extractError && (
                <p className="mt-2 text-[10px] text-red-400">{extractError}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground/90">Fundos em gradiente</p>
            {activeBgPreset && !hasBgImage && (
              <button
                type="button"
                className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={clearBackgroundPreset}
              >
                Remover gradiente
              </button>
            )}
          </div>
          <p className="mb-3 text-[10px] text-muted-foreground/80">
            Estilo spotlight radial — igual fundos profissionais de link-in-bio. Ao escolher, ajustamos primária, secundária e brilho para contrastar com o fundo. Imagem de fundo tem prioridade.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {BACKGROUND_PRESETS.map((preset) => {
              const selected = activeBgPreset === preset.id && !hasBgImage
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyBackgroundPreset(preset.id)}
                  disabled={hasBgImage}
                  className={`overflow-hidden rounded-lg border text-left transition-colors ${
                    selected
                      ? 'border-primary ring-1 ring-primary/40'
                      : 'border-border hover:border-primary/40'
                  } ${hasBgImage ? 'cursor-not-allowed opacity-40' : ''}`}
                  title={preset.name}
                >
                  <span
                    className="block aspect-[3/4] w-full"
                    style={{ background: preset.gradient }}
                  />
                  <span className="block px-1.5 py-1">
                    <span className="block text-[10px] font-semibold leading-tight">{preset.name}</span>
                    {preset.tag && (
                      <span className="block text-[9px] text-muted-foreground">{preset.tag}</span>
                    )}
                    <span className="mt-1 flex gap-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/20"
                        style={{ background: preset.primary }}
                        title="Cor primária sugerida"
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/20"
                        style={{ background: preset.secondary }}
                        title="Cor secundária sugerida"
                      />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          {hasBgImage && (
            <p className="mt-2 text-[10px] text-muted-foreground/75">
              Remova a imagem de fundo para usar um gradiente pronto.
            </p>
          )}
          {activePreset && !hasBgImage && (
            <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground">
                Cores ajustadas para <span className="font-semibold text-foreground">{activePreset.name}</span>.
                Personalize em <span className="font-medium text-foreground/90">Tema &amp; SEO</span> se quiser.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1 text-[10px]">
                  <span
                    className="h-4 w-4 rounded border border-border/60"
                    style={{ background: activePreset.primary }}
                  />
                  Primária
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1 text-[10px]">
                  <span
                    className="h-4 w-4 rounded border border-border/60"
                    style={{ background: activePreset.secondary }}
                  />
                  Secundária
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField
            label="Cor de fundo"
            value={brand.theme.background ?? ''}
            onChange={(background) =>
              onChange({
                ...brand,
                theme: {
                  ...brand.theme,
                  background: background || undefined,
                  backgroundPreset: undefined,
                },
              })
            }
            hint={
              hasBgImage
                ? 'Com imagem de fundo, a cor sólida não cobre a página — só afeta cards se definida'
                : activeBgPreset
                  ? 'Gradiente ativo — use "Remover gradiente" ou escolha cor sólida manualmente'
                  : 'Deixe vazio para usar o fundo escuro padrão'
            }
          />
          <div className="sm:col-span-2">
            <ImageField
              label="Imagem de fundo (página inteira)"
              value={brand.theme.backgroundImage}
              onChange={(backgroundImage) => {
                const nextBrand: BioBrand = {
                  ...brand,
                  theme: {
                    ...brand.theme,
                    backgroundImage: backgroundImage || undefined,
                    backgroundPreset: backgroundImage ? undefined : brand.theme.backgroundPreset,
                  },
                }
                onChange(nextBrand)
                if (backgroundImage) {
                  void suggestColorsFromBackground(backgroundImage, nextBrand)
                } else {
                  setImagePalette(null)
                  setExtractError(null)
                }
              }}
              hint="Cobre toda a tela. Ao enviar, sugerimos cores automaticamente para contrastar."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold">Tema & SEO</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField
            label="Cor primária"
            value={brand.theme.primary}
            onChange={(primary) =>
              onChange({
                ...brand,
                theme: { ...brand.theme, primary },
              })
            }
            hint="Botões, destaques e títulos de seção"
          />
          <ColorField
            label="Cor secundária"
            value={brand.theme.secondary ?? ''}
            onChange={(secondary) =>
              onChange({
                ...brand,
                theme: { ...brand.theme, secondary: secondary || undefined },
              })
            }
            hint="Tagline, subtítulos de seção e textos de apoio"
          />
          <div className="sm:col-span-2">
            <GlowColorField
              label="Brilho de fundo"
              value={brand.theme.glow ?? ''}
              onChange={(glow) =>
                onChange({
                  ...brand,
                  theme: { ...brand.theme, glow: glow || undefined },
                })
              }
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Título da página (SEO)</label>
            <input
              value={brand.seo.title}
              onChange={(e) =>
                onChange({ ...brand, seo: { ...brand.seo, title: e.target.value } })
              }
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Descrição (SEO)</label>
            <textarea
              rows={3}
              value={brand.seo.description}
              onChange={(e) =>
                onChange({ ...brand, seo: { ...brand.seo, description: e.target.value } })
              }
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Rodapé</label>
            <input
              value={brand.footer}
              onChange={(e) => onChange(update(brand, 'footer', e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
